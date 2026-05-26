package com.example.no_due_v10.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.*;
import com.example.no_due_v10.entity.User;
import com.example.no_due_v10.repository.UserRepository;

@Service()
public class UserService {

    @Autowired()
    private UserRepository userRepository;

    public User createUser(User entity) {
        return userRepository.save(entity);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    public User updateUser(String id, User entity) {
        if (userRepository.existsById(id)) {
            entity.setId(id);
            return userRepository.save(entity);
        }
        return null;
    }

    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }
}
