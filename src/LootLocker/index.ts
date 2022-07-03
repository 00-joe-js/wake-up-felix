import axios from "axios";

const leaderboardUrl = "https://dr06qxtr.api.lootlocker.io/game/leaderboards/xp/submit";
const authUrl = "https://dr06qxtr.api.lootlocker.io/game/v2/session/guest";

let sessionId: string | null = null;

export const submitScoreToLeaderboard = async (name: string, score: number) => {

    const response = await axios.post(leaderboardUrl, {
        name, score
    }, {
        headers: {
            "x-session-token": sessionId || ""
        }
    });

    console.log(response);

};

export const registerSession = async () => {

    const response = await axios.post(authUrl, {
        "game_key": "6c76e5729a75c11be3de40e210250dad79f8123c",
        "development_mode": true,
        "game_version": "0.1.0.0"
    });

    sessionId = response.data.session_token;

}