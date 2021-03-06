export default [
    {
        id: "MORE_SPEED",
        name: "More Speed",
        description: "You're faster.",
        scalarLabel: (perc: string) => `${perc} of usual speed bonus`
    },
    {
        id: "MORE_WEAPON_DAMAGE",
        name: "More Damage",
        description: "Your weapons do more damage.",
        scalarLabel: (perc: string) => `${perc} of usual damage bonus`
    },
    {
        id: "HEAL_NOW",
        name: "Heal Me!",
        description: "Get a heal right now.",
        scalarLabel: (perc: string, scalar: number, felixHP: number) => `+${Math.floor(scalar)} HP (currently at ${felixHP} HP)`
    },
    {
        id: "SLOWER_ENEMIES",
        name: "Slow Enemies",
        description: "Enemies are slower.",
        scalarLabel: (perc: string) => `${perc} of usual slow-down`
    },
    {
        id: "PICK_UP_RANGE",
        name: "More Magnetic",
        description: "Pick up XP from farther away.",
        scalarLabel: (perc: string) => `${perc} usual range increase`
    },
    {
        id: "LUCKY",
        name: "Lucky",
        description: "More likely to see rare XP gems.",
        scalarLabel: (perc: string) => `${perc} usual chance increase`
    },
    {
        id: "FREEZE",
        name: "Stun All Enemies",
        description: "Every enemy on the clock becomes stunned for 15 seconds.",
        scalarLabel: (perc: string) => `${perc} usual freeze duration`
    }
];
