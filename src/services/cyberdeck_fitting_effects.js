const addModEffect = function(mod, deck) {
    updateMod('add', mod.name, deck)
}

const removeModEffect = function(mod, deck) {
    updateMod('remove', mod.name, deck)
}

const updateMod = function(action, modName, deck) {
    switch (modName) {
        case 'Bespoke Code Optimization':
            break
        case 'Buffer Circuits':
            action === 'add' ? bufferCircuits.add(deck) : bufferCircuits.remove(deck)
            break
        case 'CPU Overclocking':
            action === 'add' ? cpuOverclocking.add(deck) : cpuOverclocking.remove(deck)
            break
        case 'Memory Expansion':
            action === 'add' ? memoryExpansion.add(deck) : memoryExpansion.remove(deck)
            break
        case 'Polymorphic Intrusion Algorithms':
            action === 'add' ? polymorphicIntrusion.add(deck) : polymorphicIntrusion.remove(deck)
            break
        case 'Skeletal Case':
            action === 'add' ? skeletalCase.add(deck) : skeletalCase.remove(deck)
            break
        case 'Thermal Exhaust Case':
            action === 'add' ? thermalExhaustCase.add(deck) : thermalExhaustCase.remove(deck)
            break
    }
}

const bufferCircuits = {
    add(deck) {
        deck.extraShielding ??= 0
        deck.extraShielding += 5
    },
    remove(deck) {
        deck.extraShielding -= 5
    }
}

const cpuOverclocking = {
    add(deck) {
        deck.extraCpu ??= 0
        deck.extraCpu += 1
    },
    remove(deck) {
        deck.extraCpu -= 1
    }
}

const memoryExpansion = {
    add(deck) {
        deck.extraMemory ??= 0
        deck.extraMemory += 4
    },
    remove(deck) {
        deck.extraMemory -= 4
    }
}

const polymorphicIntrusion = {
    add(deck) {
        deck.extraBonusAccess ??= 0
        deck.extraBonusAccess += 1
        deck.extraCpu ??= 0
        deck.extraCpu -= 1
    },
    remove(deck) {
        deck.extraBonusAccess -= 1
        deck.extraCpu += 1
    }
}

const skeletalCase = {
    add(deck) {
        deck.extraEnc ??= 0
        deck.extraEnc -= 1
        deck.extraMemory ??= 0
        deck.extraMemory -= 2
    },
    remove(deck) {
        deck.extraEnc += 1
        deck.extraMemory += 2
    }
}

const thermalExhaustCase = {
    add(deck) {
        deck.extraEnc ??= 0
        deck.extraEnc += 1
        deck.extraCpu ??= 0
        deck.extraCpu += 1
    },
    remove(deck) {
        deck.extraEnc -= 1
        deck.extraCpu -= 1
    }
}

export { addModEffect, removeModEffect }
