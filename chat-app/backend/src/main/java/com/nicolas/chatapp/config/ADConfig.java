package com.nicolas.chatapp.config;

import com.nicolas.chatapp.service.ADAuthService;
import com.nicolas.chatapp.service.implementation.LdapADAuthService;
import com.nicolas.chatapp.service.implementation.TestADAuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class ADConfig {

    @Value("${ad.mode:test}")
    private String adMode;

    @Value("${ad.server:}")
    private String adServer;

    @Value("${ad.base-dn:}")
    private String baseDn;

    @Value("${ad.bind-user:}")
    private String bindUser;

    @Value("${ad.bind-password:}")
    private String bindPassword;

    @Bean
    public ADAuthService adAuthService() {
        if ("ldap".equalsIgnoreCase(adMode)) {
            log.info("AD режим: LDAP (сервер: {})", adServer);
            return new LdapADAuthService(adServer, baseDn, bindUser, bindPassword);
        }

        log.info("AD режим: TEST (тестовые пользователи)");
        return new TestADAuthService();
    }
}
