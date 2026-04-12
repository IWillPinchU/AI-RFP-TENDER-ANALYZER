package com.dce.rfp.repository;

import com.dce.rfp.entity.Role;
import com.dce.rfp.entity.enums.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Integer> {

  Optional<Role> findByName(RoleName name);
}
