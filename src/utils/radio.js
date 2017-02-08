import Radio from 'backbone.radio';

const GLOBAL_CHANNEL_NAME = 'global';

export function getGlobalChannelName() {
    return GLOBAL_CHANNEL_NAME;
}
export function createChannel(chanel_name) {
    return Radio.channel(chanel_name);
}
export const globalChannel = createChannel(getGlobalChannelName());
