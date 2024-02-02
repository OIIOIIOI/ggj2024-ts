import { Config } from "./config";

export const clamp = (min: number, max: number, v: number) => Math.min(Math.max(v, min), max);
export const lerp = (a: number, b: number, t: number) => (1 - t) * a + b * t;
export const ilerp = (a: number, b: number, v: number) => (v - a) / (b - a);

export const logToDiscord = (content: string) => {
    if (Config.discordWebhook === "") {
        // console.log("no webhook url");
        return;
    }

    const request = new XMLHttpRequest();
    request.open("POST", Config.discordWebhook);
    request.setRequestHeader('Content-type', 'application/json');
    const params = {
        "content": content,
        "embeds": null,
        "attachments": [],
    }
    request.send(JSON.stringify(params));
}