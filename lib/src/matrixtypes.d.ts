export interface IMatrixEventContent {
    body?: string;
    info?: any;
    name?: string;
    topic?: string;
    membership?: string;
    msgtype?: string;
    url?: string;
    displayname?: string;
    avatar_url?: string;
    reason?: string;
    "m.relates_to"?: any;
}
export interface IMatrixEvent {
    event_id: string;
    state_key: string;
    type: string;
    sender: string;
    room_id: string;
    membership?: string;
    avatar_url?: string;
    displayname?: string;
    redacts?: string;
    replaces_state?: string;
    content?: IMatrixEventContent;
    unsigned?: any;
    origin_server_ts?: number;
    users?: any;
    users_default?: any;
    notifications?: any;
}
export interface IMatrixMessage {
    body: string;
    msgtype: string;
    formatted_body?: string;
    format?: string;
}
export interface IMatrixMediaInfo {
    w?: number;
    h?: number;
    mimetype: string;
    size: number;
    duration?: number;
}
