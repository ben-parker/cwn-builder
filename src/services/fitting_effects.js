let drone = {};

const addFittingEffect = function(name, currentDrone) {
    drone = currentDrone;
    updateStats('add', name);
};

const removeFittingEffect = function(name, currentDrone) {
    drone = currentDrone;
    updateStats('remove', name);
};

const updateStats = function(action, fittingName) {
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
                enhancedStructure.add();
            else if (action === 'remove')
                enhancedStructure.remove();
            break;
        case 'Extended Range':
            break;
        case 'Glider Grips':
            break;
        case 'Improved Armor':
            if (action === 'add')
                improvedArmor.add();
            else if (action === 'remove')
                improvedArmor.remove();
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
                weaponHardpoint.add();
            else if (action === 'remove')
                weaponHardpoint.remove();
            break;
        
    }
};

const ablativeCodeBuffer = {
    add() {

    },
    remove() {

    }
};

const altitudeBoostUnit = {
    add() {

    },
    remove() {

    }
};

const ammoCaddy = {
    add() {

    },
    remove() {

    }
};

const ammoSupply = {
    add() {

    },
    remove() {

    }
};

const assistedBoostBurner = {
    add() {

    },
    remove() {

    }
};

const cargoSpace = {
    add() {

    },
    remove() {

    }
};

const commandDeckFollow = {
    add() {

    },
    remove() {

    }
};

const commandDeckKill = {
    add() {

    },
    remove() {

    }
};

const commandDeckPatrol = {
    add() {

    },
    remove() {

    }
};

const commandDeckWatch = {
    add() {

    },
    remove() {

    }
};

const emergencyEvacLitter = {
    add() {

    },
    remove() {

    }
};

const emissionsShielding = {
    add() {

    },
    remove() {

    }
};

const enhancedStructure = {
    add() {
        drone.extraHp ??= 0;        
        drone.extraHp += Math.ceil(drone.hp * 0.25);
    },
    remove() {
        drone.extraHp -= Math.ceil(drone.hp * 0.25);
    }
};

const extendedRange = {
    add() {

    },
    remove() {

    }
};

const gliderGrips = {
    add() {

    },
    remove() {

    }
};

const improvedArmor = {
    add() {
        if (!parseInt(drone.encumbrance))
            return;

        drone.extraAc ??= 0;
        drone.extraAc += Math.min(18 - drone.ac, 2);

        drone.extraEncumbrance ??= 0
        drone.extraEncumbrance += 1;
    },
    remove() {
        if (!parseInt(drone.encumbrance))
            return;

        drone.extraAc = Math.max(drone.extraAc - 2, 0);
        drone.extraEncumbrance -= 1;
    }
};

const improvedTargetingLogic = {
    add() {

    },
    remove() {

    }
};

const laserComms = {
    add() {

    },
    remove() {

    }
};

const manipulatorTendrils = {
    add() {

    },
    remove() {

    }
};

const memoryBanks = {
    add() {

    },
    remove() {

    }
};

const noTouchWeb = {
    add() {

    },
    remove() {

    }
};

const sleepMode = {
    add() {

    },
    remove() {

    }
};

const stealthPackage = {
    add() {

    },
    remove() {

    }
};

const suicideCharge = {
    add() {

    },
    remove() {

    }
};

const telescopicOptics = {
    add() {

    },
    remove() {

    }
};

const thermalOptics = {
    add() {

    },
    remove() {

    }
};

const traumaResponseSuite = {
    add() {

    },
    remove() {

    }
};

const voiceBroadcast = {
    add() {

    },
    remove() {

    }
};

const wallcrawler = {
    add() {

    },
    remove() {

    }
};

const weaponHardpoint = {
    add() {
        drone.extraFittings ??= 0;
        drone.extraFittings += 1;
    },
    remove() {
        drone.extraFittings -= 1;
    }
};


export { addFittingEffect, removeFittingEffect };