package com.chat.app.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    // Все пути, не начинающиеся с /api, /auth, /ws, /files — отдаём index.html (React Router)
    @GetMapping(value = {"/", "/{path:^(?!api|auth|ws).*}/**"})
    public String forward() {
        return "forward:/index.html";
    }
}
