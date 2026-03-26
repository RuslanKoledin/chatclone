package com.chat.app.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * SPA контроллер — перенаправляет все не-API пути на index.html.
 * Статические файлы (JS, CSS, картинки) раздаются Spring Boot автоматически из /static/.
 */
@Controller
public class SpaWebConfig {

    @GetMapping(value = {"/", "/{path:^(?!api|auth|ws|static).*$}/**"})
    public String forward() {
        return "forward:/index.html";
    }
}
