package com.example.no_due_v10.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import java.util.Optional;
import com.example.no_due_v10.service.UserService;
import com.example.no_due_v10.entity.User;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController()
@RequestMapping(value = "/api/users")
public class UserController {

    @Autowired()
    private UserService userService;

    @PostMapping()
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<User> createUser(@RequestBody User entity) {
        return ResponseEntity.ok(userService.createUser(entity));
    }

    @GetMapping()
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return userService.getUserById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<User> updateUser(@PathVariable String id, @RequestBody User entity) {
        User updated = userService.updateUser(id, entity);
        if (updated != null)
            return ResponseEntity.ok(updated);
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
