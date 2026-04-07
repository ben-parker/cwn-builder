const addModEffect = function(mod, drone) {
    if (mod.type === 'fitting') {
        updateFitting('add', mod.name, drone);
    } else {
        updateMod('add', mod.name, drone);
    }
};

const removeModEffect = function(mod, drone) {
    if (mod.type === 'fitting') {
        updateFitting('remove', mod.name, drone);
    } else {
        updateMod('remove', mod.name, drone);
    }
};

const updateFitting = function(action, fittingName, drone) {
    switch(fittingName) {
        case 'Ablative Code Buffer':
            break;
        case 'Altitude Boost Unit':
            break;
        case 'Ammo Caddy':
            break;
        case 'Ammo Supply':
            break;
        case 'Assisted Boost Burner':
            break;
        case 'Cargo Space':
            break;
        case 'Command Deck/Follow':
            break;
        case 'Command Deck/Kill':
            break;
        case 'Command Deck/Patrol':
            break;
        case 'Command Deck/Watch':
            break;
        case 'Emergency Evac Litter':
            break;
        case 'Emissions Shielding':
            break;
        case 'Enhanced Structure':
            if (action === 'add')
                enhancedStructure.add(drone);
            else if (action === 'remove')
                enhancedStructure.remove(drone);
            break;
        case 'Extended Range':
            break;
        case 'Glider Grips':
            break;
        case 'Improved Armor':
            if (action === 'add')
                improvedArmor.add(drone);
            else if (action === 'remove')
                improvedArmor.remove(drone);
            break;
        case 'Improved Targeting Logic':
            break;
        case 'Laser Comms':
            break;
        case 'Manipulator Tendrils':
            break;
        case 'Memory Banks':
            break;
        case 'No Touch Web':
            break;
        case 'Sleep Mode':
            break;
        case 'Stealth Package':
            break;
        case 'Suicide Charge':
            break;
        case 'Telescopic Optics':
            break;
        case 'Thermal Optics':
            break;
        case 'Trauma Response Suite':
            break;
        case 'Voice Broadcast':
            break;
        case 'Wallcrawler':
            break;
        case 'Weapon Hardpoint':
            if (action === 'add')
                weaponHardpoint.add(drone);
            else if (action === 'remove')
                weaponHardpoint.remove(drone);
            break;

    }
};

const updateMod = function(action, modName, drone) {
    switch (modName) {
        case 'Additional Fitting':
            action === 'add' ? additionalFitting.add(drone) : additionalFitting.remove(drone);
            break;
        case 'Additional Hardpoint':
            action === 'add' ? additionalHardpoint.add(drone) : additionalHardpoint.remove(drone);
            break;
        case 'Battery Swapping':
            break;
        case 'Boosted Engine':
            action === 'add' ? boostedEngine.add(drone) : boostedEngine.remove(drone);
            break;
        case 'Heavy Plating':
            action === 'add' ? heavyPlating.add(drone) : heavyPlating.remove(drone);
            break;
        case 'Quick Launch':
            break;
        case 'Redundant Systems':
            action === 'add' ? redundantSystems.add(drone) : redundantSystems.remove(drone);
            break;
        case 'Stripped Fittings':
            action === 'add' ? strippedFittings.add(drone) : strippedFittings.remove(drone);
            break;

    }
};

const enhancedStructure = {
    add(drone) {
        drone.extraHp ??= 0;
        drone.extraHp += Math.ceil(drone.hp * 0.25);
    },
    remove(drone) {
        drone.extraHp -= Math.ceil(drone.hp * 0.25);
    }
};

const improvedArmor = {
    add(drone) {
        if (!parseInt(drone.encumbrance))
            return;

        drone.extraAc ??= 0;
        drone.extraAc += Math.min(18 - drone.ac, 2);

        drone.extraEncumbrance ??= 0
        drone.extraEncumbrance += 1;
    },
    remove(drone) {
        if (!parseInt(drone.encumbrance))
            return;

        drone.extraAc = Math.max(drone.extraAc - 2, 0);
        drone.extraEncumbrance -= 1;
    }
};

const weaponHardpoint = {
    add(drone) {
        drone.extraHardpoints ??= 0;
        drone.extraHardpoints += 1;

        drone.extraFittings ??= 0;
        drone.extraFittings += 1;
    },
    remove(drone) {
        drone.extraHardpoints -= 1;
        drone.extraFittings -= 1;
    }
};

const additionalFitting = {
    add(drone) {
        drone.extraMaxFittings ??= 0;
        drone.extraMaxFittings += 1;
        if (parseInt(drone.encumbrance)) {
            drone.extraEncumbrance ??= 0;
            drone.extraEncumbrance += 1;
        }
    },
    remove(drone) {
        drone.extraMaxFittings -= 1;
        if (parseInt(drone.encumbrance)) {
            drone.extraEncumbrance -= 1;
        }
    }
};

const additionalHardpoint = {
    add(drone) {
        drone.extraHardpoints ??= 0;
        drone.extraHardpoints += 1;
        if (parseInt(drone.encumbrance)) {
            drone.extraEncumbrance ??= 0;
            drone.extraEncumbrance += 1;
        }
    },
    remove(drone) {
        drone.extraHardpoints -= 1;
        if (parseInt(drone.encumbrance)) {
            drone.extraEncumbrance -= 1;
        }
    }
};

const boostedEngine = {
    add(drone) {
        drone.extraMove ??= 0;
        drone.extraMove += 10;
    },
    remove(drone) {
        drone.extraMove -= 10;
    }
};

const heavyPlating = {
    add(drone) {
        drone.extraMove ??= 0;
        drone.extraMove += -5;

        drone.extraAc ??= 0;
        drone.extraAc += 2;

        if (parseInt(drone.encumbrance)) {
            drone.extraEncumbrance ??= 0;
            drone.extraEncumbrance += 1;
        }
    },
    remove(drone) {
        drone.extraMove += 5;
        drone.extraAc -= 2;

        if (parseInt(drone.encumbrance)) {
            drone.extraEncumbrance -= 1;
        }
    }
};

const redundantSystems = {
    add(drone) {
        drone.extraHp ??= 0;
        drone.extraHp += Math.ceil(drone.hp * 0.25);
        if (parseInt(drone.encumbrance)) {
            drone.extraEncumbrance ??= 0;
            drone.extraEncumbrance += 1;
        }
    },
    remove(drone) {
        drone.extraHp -= Math.ceil(drone.hp * 0.25);
        if (parseInt(drone.encumbrance)) {
            drone.extraEncumbrance -= 1;
        }
    }
};

const strippedFittings = {
    add(drone) {
        drone.extraMaxFittings ??= 0;
        drone.extraMaxFittings += -1;
        if (parseInt(drone.encumbrance) && drone.encumbrance > 1) {
            drone.extraEncumbrance ??= 0;
            drone.extraEncumbrance += -1;
        }
    },
    remove(drone) {
        drone.extraMaxFittings += 1;
        if (parseInt(drone.encumbrance) && drone.extraEncumbrance < 0) {
            drone.extraEncumbrance -= -1;
        }
    }
};



export { addModEffect, removeModEffect };
