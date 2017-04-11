import chrome from './case-4-chrome.png';
import firefox from './case-4-firefox.png';
import phantom from './case-4-phantom.png';

const unit_data = {
    mark: 'ED01>',
    width: 42,
    height: 84,
    opening_direction: 'Inward'
};
const profile_data = {
    name: 'THERMO DOOR',
    unit_type: 'Entry Door',
    frame_width: 69.5,
    mullion_width: 94,
    sash_frame_width: 94.5,
    sash_frame_overlap: 45,
    sash_mullion_overlap: 12,
    threshold_width: 20,
    low_threshold: true
};
const root_section_data = {
    id: '15691',
    sashType: 'turn_only_left',
    fillingType: 'full-flush-panel',
    fillingName: 'Full Flush Foam Filled Aluminum'
};
const root_section_json_string = JSON.stringify(root_section_data);
const preview_settings = {
    width: 500,
    height: 500,
    position: 'inside',
    hingeIndicatorMode: 'american'
};

export default {
    title: 'Unit ED01> from Placetailor - Thornton Manor',
    unit_data,
    profile_data,
    root_section_data,
    root_section_json_string,
    preview_settings,
    imgData: {chrome, firefox, phantom}
};
