package com.chat.app.controllers;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController implements ErrorController {

    // Корневой путь → index.html
    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }

    // Для SPA: все 404 (несуществующие пути) → index.html (React Router разберётся)
    @GetMapping("/error")
    public String handleError() {
        return "forward:/index.html";
    }
}
