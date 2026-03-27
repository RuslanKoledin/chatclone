package com.chat.app.config;

import javax.net.SocketFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.io.IOException;
import java.net.InetAddress;
import java.net.Socket;
import java.security.cert.X509Certificate;

/**
 * SSL Socket Factory, которая доверяет всем сертификатам.
 * Используется для подключения к AD через ldaps:// с самоподписанным сертификатом.
 * Аналог ssl.CERT_NONE в Python.
 */
public class TrustAllSSLSocketFactory extends SSLSocketFactory {

    private final SSLSocketFactory delegate;

    public TrustAllSSLSocketFactory() {
        try {
            SSLContext ctx = SSLContext.getInstance("TLS");
            ctx.init(null, new TrustManager[]{new X509TrustManager() {
                @Override
                public void checkClientTrusted(X509Certificate[] chain, String authType) {}
                @Override
                public void checkServerTrusted(X509Certificate[] chain, String authType) {}
                @Override
                public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
            }}, new java.security.SecureRandom());
            delegate = ctx.getSocketFactory();
        } catch (Exception e) {
            throw new RuntimeException("Failed to create TrustAll SSL factory", e);
        }
    }

    // Статический метод — обязателен для JNDI
    public static SocketFactory getDefault() {
        return new TrustAllSSLSocketFactory();
    }

    @Override
    public String[] getDefaultCipherSuites() { return delegate.getDefaultCipherSuites(); }
    @Override
    public String[] getSupportedCipherSuites() { return delegate.getSupportedCipherSuites(); }
    @Override
    public Socket createSocket(Socket s, String host, int port, boolean autoClose) throws IOException {
        return delegate.createSocket(s, host, port, autoClose);
    }
    @Override
    public Socket createSocket(String host, int port) throws IOException {
        return delegate.createSocket(host, port);
    }
    @Override
    public Socket createSocket(String host, int port, InetAddress localHost, int localPort) throws IOException {
        return delegate.createSocket(host, port, localHost, localPort);
    }
    @Override
    public Socket createSocket(InetAddress host, int port) throws IOException {
        return delegate.createSocket(host, port);
    }
    @Override
    public Socket createSocket(InetAddress address, int port, InetAddress localAddress, int localPort) throws IOException {
        return delegate.createSocket(address, port, localAddress, localPort);
    }
}
