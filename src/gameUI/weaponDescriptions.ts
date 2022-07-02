export type WeaponDescription = {
    roman: string,
    heading: string,
    elaborate: string,
};

const lib: { [k: string]: WeaponDescription } = {
    "1": {
        roman: "I",
        heading: "Fire an arrow out from the 1:00 angle on a clock.",
        elaborate: "This arrow doesn't stun enemies much, but it fires fast and has huge range!"
    },
    "2": {
        roman: "II",
        heading: "Swing a beefy hammer around you that gets larger when it is close to the 2:00 angle.",
        elaborate: "Not only does the number II hit powerfully, it also stuns enemies big time!"
    },
    "3": {
        roman: "III",
        heading: "Plant spiky traps every 3 seconds at the 3:00 angle. You can have 3 planted at once.",
        elaborate: "Time your steps and funnel enemies into your traps. They will stumble and stick as they take damage trying to wade through!"
    },
    "4": {
        roman: "IV",
        heading: "A deadly spear juts out from your 4:00 angle. It doesn't move but does lots of damage.",
        elaborate: "IV is the definition of simple but effective. Not very effective if enemies are above you!"
    },
    "5": {
        roman: "V",
        heading: "Surround yourself with protective shields and get 1 extra HP (for a total of 5:00).",
        elaborate: "More health always helps, not to mention this orbiting wall! The same enemy cannot be hit very frequently with these shields, so be careful."
    },
    "6": {
        roman: "VI",
        heading: "A magic scepter that hovers below you at 6:00. It fires orbs at random nearby enemies, but only 6 at a time.",
        elaborate: "This weapon excels against single enemies, but struggles against hordes."
    },
    "7": {
        roman: "VII",
        heading: "An energizing contraption that hovers at 7:00 and gives you a damaging aura. It also increases your pickup range!",
        elaborate: "You'll feel all charged up with this one! Anything that gets near you is zapped, but enemies with enough health will still power through it."
    },
    "8": {
        roman: "VIII",
        heading: "Every 8 seconds, spawn a huge smoke stack that damages and stuns enemies.",
        elaborate: "The smoke will absolutely incapacitate anything within it, but it will only spawn on a random enemy every 8 seconds. You will have to act fast to manuever your enemies into the smoke!"
    }
};

export default lib;