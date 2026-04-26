package com.dce.rfp.service;

import java.io.IOException;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.dce.rfp.entity.RefreshToken;
import com.dce.rfp.entity.Role;
import com.dce.rfp.entity.User;
import com.dce.rfp.entity.enums.AuthProvider;
import com.dce.rfp.entity.enums.RoleName;
import com.dce.rfp.repository.RoleRepository;
import com.dce.rfp.repository.UserRepository;
import com.dce.rfp.security.CustomUserDetails;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

        @Value("${app.frontend-url}")
        private String frontendUrl;
        private final UserRepository userRepository;
        private final RoleRepository roleRepository;
        private final JwtService jwtService;
        private final RefreshTokenService refreshTokenService;

        @Override
        public void onAuthenticationSuccess(
                HttpServletRequest request,
                HttpServletResponse response,
                Authentication authentication
        ) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");
        String googleId = oAuth2User.getAttribute("sub");

        
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                            .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_USER)));

                    User newUser = User.builder()
                            .firstName(firstName != null ? firstName : "")
                            .lastName(lastName != null ? lastName : "")
                            .email(email)
                            .provider(AuthProvider.GOOGLE)
                            .providerId(googleId)
                            .enabled(true)  
                            .roles(Set.of(userRole))
                            .build();

                    return userRepository.save(newUser);
                });

        
        CustomUserDetails userDetails = new CustomUserDetails(user);
        String accessToken = jwtService.generateAccessToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        
        String redirectUrl = frontendUrl + "/oauth-callback"
        + "?accessToken=" + accessToken
        + "&refreshToken=" + refreshToken.getToken();
        response.sendRedirect(redirectUrl);
    }
}
