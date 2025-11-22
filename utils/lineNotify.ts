import axios, { type AxiosResponse } from "axios";

export interface LineTextMessage {
  type: "text";
  text: string;
}

export interface LinePushRequest {
  to?: string;
  messages: LineTextMessage[];
}

export interface LineRequestHeaders {
  "Content-Type": "application/json";
  Authorization: string;
  [key: string]: string;
}

export async function sendLineMessage(message: string): Promise<any> {
  const accessToken: string | undefined = process.env.LINE_ACCESS_TOKEN;
  const groupId: string | undefined = process.env.LINE_GROUP_ID;

  try {
    const payload: LinePushRequest = {
      ...(groupId ? { to: groupId } : {}),
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    };

    const headers: LineRequestHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const response: AxiosResponse<any> = await axios.post(
      "https://api.line.me/v2/bot/message/push",
      payload,
      {
        headers,
      }
    );

    return response.data;
  } catch (error: unknown) {
    console.error(
      "Error sending LINE message:",
      (error as any).response?.data || (error as Error).message
    );
    throw error;
  }
}
