package com.nicolas.chatapp.service.implementation;

import com.nicolas.chatapp.service.ADAuthService;
import lombok.extern.slf4j.Slf4j;

import javax.naming.Context;
import javax.naming.NamingEnumeration;
import javax.naming.directory.*;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Map;

/**
 * Реализация AD-аутентификации через LDAP.
 * Используется при ad.mode=ldap.
 */
@Slf4j
public class LdapADAuthService implements ADAuthService {

    private final String adServer;
    private final String baseDn;
    private final String bindUser;
    private final String bindPassword;

    public LdapADAuthService(String adServer, String baseDn, String bindUser, String bindPassword) {
        this.adServer = adServer;
        this.baseDn = baseDn;
        this.bindUser = bindUser;
        this.bindPassword = bindPassword;
    }

    @Override
    public Map<String, String> authenticate(String username, String password) {
        log.info("[LDAP AD] Попытка аутентификации пользователя: {}", username);

        // 1. Сначала ищем DN пользователя через сервисную учётку
        String userDn = findUserDn(username);
        if (userDn == null) {
            log.warn("[LDAP AD] Пользователь {} не найден в AD", username);
            return null;
        }

        // 2. Пробуем bind с credentials пользователя
        Hashtable<String, String> env = buildLdapEnv(userDn, password);
        try {
            DirContext ctx = new InitialDirContext(env);
            ctx.close();
        } catch (javax.naming.AuthenticationException e) {
            log.warn("[LDAP AD] Неверный пароль для пользователя: {}", username);
            return null;
        } catch (Exception e) {
            log.error("[LDAP AD] Ошибка аутентификации для {}: {}", username, e.getMessage());
            return null;
        }

        // 3. Подтягиваем атрибуты пользователя
        return fetchUserAttributes(username);
    }

    private String findUserDn(String username) {
        Hashtable<String, String> env = buildLdapEnv(bindUser, bindPassword);
        try {
            DirContext ctx = new InitialDirContext(env);
            SearchControls controls = new SearchControls();
            controls.setSearchScope(SearchControls.SUBTREE_SCOPE);

            String filter = "(sAMAccountName=" + escapeLdapFilter(username) + ")";
            NamingEnumeration<SearchResult> results = ctx.search(baseDn, filter, controls);

            if (results.hasMore()) {
                String dn = results.next().getNameInNamespace();
                ctx.close();
                return dn;
            }
            ctx.close();
        } catch (Exception e) {
            log.error("[LDAP AD] Ошибка поиска пользователя {}: {}", username, e.getMessage());
        }
        return null;
    }

    private Map<String, String> fetchUserAttributes(String username) {
        Hashtable<String, String> env = buildLdapEnv(bindUser, bindPassword);
        try {
            DirContext ctx = new InitialDirContext(env);
            SearchControls controls = new SearchControls();
            controls.setSearchScope(SearchControls.SUBTREE_SCOPE);
            controls.setReturningAttributes(new String[]{
                    "sAMAccountName", "displayName", "mail", "department", "title"
            });

            String filter = "(sAMAccountName=" + escapeLdapFilter(username) + ")";
            NamingEnumeration<SearchResult> results = ctx.search(baseDn, filter, controls);

            if (results.hasMore()) {
                Attributes attrs = results.next().getAttributes();
                Map<String, String> result = new HashMap<>();
                result.put("username", getAttr(attrs, "sAMAccountName"));
                result.put("fullName", getAttr(attrs, "displayName"));
                result.put("email", getAttr(attrs, "mail"));
                result.put("department", getAttr(attrs, "department"));
                result.put("title", getAttr(attrs, "title"));
                ctx.close();

                log.info("[LDAP AD] Пользователь {} успешно аутентифицирован", username);
                return result;
            }
            ctx.close();
        } catch (Exception e) {
            log.error("[LDAP AD] Ошибка получения атрибутов {}: {}", username, e.getMessage());
        }
        return null;
    }

    private Hashtable<String, String> buildLdapEnv(String principal, String credentials) {
        Hashtable<String, String> env = new Hashtable<>();
        env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
        env.put(Context.PROVIDER_URL, adServer);
        env.put(Context.SECURITY_AUTHENTICATION, "simple");
        env.put(Context.SECURITY_PRINCIPAL, principal);
        env.put(Context.SECURITY_CREDENTIALS, credentials);

        if (adServer.startsWith("ldaps://")) {
            env.put(Context.SECURITY_PROTOCOL, "ssl");
        }

        return env;
    }

    private String getAttr(Attributes attrs, String name) {
        try {
            Attribute attr = attrs.get(name);
            return attr != null ? attr.get().toString() : "";
        } catch (Exception e) {
            return "";
        }
    }

    private String escapeLdapFilter(String input) {
        StringBuilder sb = new StringBuilder();
        for (char c : input.toCharArray()) {
            switch (c) {
                case '\\': sb.append("\\5c"); break;
                case '*': sb.append("\\2a"); break;
                case '(': sb.append("\\28"); break;
                case ')': sb.append("\\29"); break;
                case '\0': sb.append("\\00"); break;
                default: sb.append(c);
            }
        }
        return sb.toString();
    }
}
