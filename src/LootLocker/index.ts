import axios from "axios";

const getLeaderBoardUrl = "https://dr06qxtr.api.lootlocker.io/game/leaderboards/xp/list?count=100&after=0"
const leaderboardUrl = "https://dr06qxtr.api.lootlocker.io/game/leaderboards/xp/submit";
const authUrl = "https://dr06qxtr.api.lootlocker.io/game/v2/session/guest";

let sessionId: string | null = null;

export type LootLockerScoreRow = {
    member_id: string,
    metadata: string,
    player: {
        id: number,
        name: string,
        public_uid: string
    },
    rank: number,
    score: number
};

export const registerSession = async () => {

    const response = await axios.post(authUrl, {
        "game_key": "6c76e5729a75c11be3de40e210250dad79f8123c",
        "development_mode": true,
        "game_version": "0.1.0.0"
    });

    sessionId = response.data.session_token;

};


export const submitScoreToLeaderboard = async (score: number, metadata: string) => {

    if (!sessionId) {
        throw new Error("No session ID established with LootLocker.");
    }

    console.log(score, metadata);
    const response = await axios.post(leaderboardUrl, {
        score, metadata
    }, {
        headers: {
            "x-session-token": sessionId || ""
        }
    });

    console.log(response.data);

    return response.data;

};


export const getLeaderboard = async () => {

    if (!sessionId) {
        throw new Error("No session ID established with LootLocker.");
    }

    const response = await axios.get(getLeaderBoardUrl, {
        headers: {
            "x-session-token": sessionId || ""
        }
    });

    return response.data.items;

};