const addModEffect = function(mod, vehicle) {
    if (mod.type === 'fitting') {
        updateFitting('add', mod.name, vehicle);
    } else {
        updateMod('add', mod.name, vehicle);
    }
};

const removeModEffect = function(mod, vehicle) {
    if (mod.type === 'fitting') {
        updateFitting('remove', mod.name, vehicle);
    } else {
        updateMod('remove', mod.name, vehicle);
    }
};

const updateFitting = function(action, fittingName, vehicle) {
    switch(fittingName) {
        case 'Advanced Sensors':
            break;
        case 'Afterburners':
            break;
        case 'Armor Plating':
            action === 'add' ? armorPlating.add(vehicle) : armorPlating.remove(vehicle);
            break;
        case 'Cargo Space':
            break;
        case 'Crash Pod':
            break;
        case 'ECM Emitter':
            break;
        case 'Emissions Cloaking':
            break;
        case 'Extra Durability':
            action === 'add' ? extraDurability.add(vehicle) : extraDurability.remove(vehicle);
            break;
        case 'Extra Passengers':
            action === 'add' ? extraPassengers.add(vehicle) : extraPassengers.remove(vehicle);
            break;
        case 'Field Portable':
            break;
        case 'Ghost Driver':
            break;
        case 'Hardpoint Support':
            action === 'add' ? hardpointSupport.add(vehicle) : hardpointSupport.remove(vehicle);
            break;
        case 'Jack Control Port':
            break;
        case 'Limpet Mount (Small)':
            break;
        case 'Limpet Mount (Medium)':
            break;
        case 'Living Quarters':
            break;
        case 'Medbay':
            break;
        case 'Offroad Package':
            break;
        case 'Power System, Small':
            break;
        case 'Power System, Medium':
            break;
        case 'Power System, Large':
            break;
        case 'Sealed Atmosphere':
            break;
        case 'Smuggler\'s Hold':
            break;
        case 'Targeting Board':
            break;
        case 'Tool Rack':
            break;
    }
};

const updateMod = function(action, modName, vehicle) {
    switch (modName) {
        case 'Augmented Armor':
            action === 'add' ? augmentedArmor.add(vehicle) : augmentedArmor.remove(vehicle);
            break;
        case 'Drone Hub':
            break;
        case 'Extra Seating':
            action === 'add' ? extraSeating.add(vehicle) : extraSeating.remove(vehicle);
            break;
        case 'Integrated Magazines':
            break;
        case 'Personalized Controls':
            break;
        case 'Power System Upgrade':
            action === 'add' ? powerSystemUpgrade.add(vehicle) : powerSystemUpgrade.remove(vehicle);
            break;
        case 'Q-Cladding':
            break;
        case 'Reactive Defenses':
            action === 'add' ? reactiveDefenses.add(vehicle) : reactiveDefenses.remove(vehicle);
            break;
        case 'Reinforced Chassis':
            action === 'add' ? reinforcedChassis.add(vehicle) : reinforcedChassis.remove(vehicle);
            break;
        case 'Remote Sensors':
            break;
        case 'Supplementary Tanks':
            break;
        case 'Ultralight Components':
            action === 'add' ? ultralightComponents.add(vehicle) : ultralightComponents.remove(vehicle);
            break;
        case 'Upgraded Speed':
            action === 'add' ? upgradedSpeed.add(vehicle) : upgradedSpeed.remove(vehicle);
            break;
    }
};

// ===== Fitting effects =====

const armorPlating = {
    add(vehicle) {
        if (typeof vehicle.armor === 'string') return;
        vehicle.extraArmor ??= 0;
        vehicle.extraArmor += 3;
    },
    remove(vehicle) {
        if (typeof vehicle.armor === 'string') return;
        vehicle.extraArmor -= 3;
    }
};

const extraDurability = {
    add(vehicle) {
        vehicle.extraHp ??= 0;
        vehicle.extraHp += Math.ceil(vehicle.hp * 0.25);
    },
    remove(vehicle) {
        vehicle.extraHp -= Math.ceil(vehicle.hp * 0.25);
    }
};

const extraPassengers = {
    add(vehicle) {
        vehicle.extraCrew ??= 0;
        const bonus = vehicle.size === 'S' ? 1 : vehicle.size === 'M' ? 2 : 4;
        vehicle.extraCrew += bonus;
    },
    remove(vehicle) {
        const bonus = vehicle.size === 'S' ? 1 : vehicle.size === 'M' ? 2 : 4;
        vehicle.extraCrew -= bonus;
    }
};

const hardpointSupport = {
    add(vehicle) {
        vehicle.extraHardpoints ??= 0;
        vehicle.extraHardpoints += 1;
    },
    remove(vehicle) {
        vehicle.extraHardpoints -= 1;
    }
};

// ===== Mod effects =====

const augmentedArmor = {
    add(vehicle) {
        if (typeof vehicle.armor === 'string') return;
        vehicle.extraArmor ??= 0;
        vehicle.extraArmor += 3;
    },
    remove(vehicle) {
        if (typeof vehicle.armor === 'string') return;
        vehicle.extraArmor -= 3;
    }
};

const extraSeating = {
    add(vehicle) {
        vehicle.extraCrew ??= 0;
        const bonus = vehicle.size === 'S' ? 1 : vehicle.size === 'M' ? 2 : 4;
        vehicle.extraCrew += bonus;
    },
    remove(vehicle) {
        const bonus = vehicle.size === 'S' ? 1 : vehicle.size === 'M' ? 2 : 4;
        vehicle.extraCrew -= bonus;
    }
};

const powerSystemUpgrade = {
    add(vehicle) {
        vehicle.extraMaxPower ??= 0;
        const bonus = vehicle.size === 'S' ? 2 : vehicle.size === 'M' ? 3 : 4;
        vehicle.extraMaxPower += bonus;
    },
    remove(vehicle) {
        const bonus = vehicle.size === 'S' ? 2 : vehicle.size === 'M' ? 3 : 4;
        vehicle.extraMaxPower -= bonus;
    }
};

const reactiveDefenses = {
    add(vehicle) {
        vehicle.extraAc ??= 0;
        vehicle.extraAc += 2;
        if (typeof vehicle.armor !== 'string') {
            vehicle.extraArmor ??= 0;
            vehicle.extraArmor -= 2;
        }
    },
    remove(vehicle) {
        vehicle.extraAc -= 2;
        if (typeof vehicle.armor !== 'string') {
            vehicle.extraArmor += 2;
        }
    }
};

const reinforcedChassis = {
    add(vehicle) {
        vehicle.extraHp ??= 0;
        vehicle.extraHp += Math.ceil(vehicle.hp * 0.25);
        vehicle.extraMaxMass ??= 0;
        vehicle.extraMaxMass -= 2;
    },
    remove(vehicle) {
        vehicle.extraHp -= Math.ceil(vehicle.hp * 0.25);
        vehicle.extraMaxMass += 2;
    }
};

const ultralightComponents = {
    add(vehicle) {
        vehicle.extraMaxMass ??= 0;
        const massBonus = vehicle.size === 'S' ? 2 : vehicle.size === 'M' ? 3 : 4;
        vehicle.extraMaxMass += massBonus;
        vehicle.extraHp ??= 0;
        vehicle.extraHp -= Math.ceil(vehicle.hp * 0.2);
    },
    remove(vehicle) {
        const massBonus = vehicle.size === 'S' ? 2 : vehicle.size === 'M' ? 3 : 4;
        vehicle.extraMaxMass -= massBonus;
        vehicle.extraHp += Math.ceil(vehicle.hp * 0.2);
    }
};

const upgradedSpeed = {
    add(vehicle) {
        vehicle.extraSpeed ??= 0;
        vehicle.extraSpeed += 1;
        vehicle.extraMaxMass ??= 0;
        vehicle.extraMaxMass -= Math.ceil(vehicle.mass * 0.2);
    },
    remove(vehicle) {
        vehicle.extraSpeed -= 1;
        vehicle.extraMaxMass += Math.ceil(vehicle.mass * 0.2);
    }
};

export { addModEffect, removeModEffect };
