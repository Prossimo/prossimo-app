import chrome from './case-1-chrome.png';
import firefox from './case-1-firefox.png';
import phantom from './case-1-phantom.png';

const unit_data = {
    width: 62,
    height: 96
};
const profile_data = {
    frame_width: 70,
    mullion_width: 92,
    sash_frame_width: 82,
    sash_frame_overlap: 34,
    sash_mullion_overlap: 12,
    unit_type: 'Window'
};
const root_section_data = {
    id: '264',
    sashType: 'fixed_in_frame',
    fillingType: 'glass',
    fillingName: 'Glass',
    bars: {
        vertical: [
            {
                position: 478.26666666666665
            },
            {
                position: 956.5333333333333
            }
        ],
        horizontal: [
            {
                position: 766.1333333333332
            },
            {
                position: 1532.2666666666664
            }
        ]
    }
};
const root_section_json_string = JSON.stringify(root_section_data);
const preview_settings = {
    width: 500,
    height: 500,
    position: 'inside',
    hingeIndicatorMode: 'american'
};

export default {
    title: 'Unit A from fixtures with additional glazing bars',
    unit_data,
    profile_data,
    root_section_data,
    root_section_json_string,
    preview_settings,
    imgData: {chrome, firefox, phantom}
};
