import chrome from './case-3-chrome.png';
import firefox from './case-3-firefox.png';
import phantom from './case-3-phantom.png';

const unit_data = {
    mark: 'A',
    width: 36.75,
    height: 72.75
};
const profile_data = {
    name: 'Pinnacle uPVC',
    unit_type: 'Window',
    frame_width: 70,
    mullion_width: 92,
    sash_frame_width: 82,
    sash_frame_overlap: 34,
    sash_mullion_overlap: 12,
    threshold_width: 20,
    low_threshold: false
};
const root_section_data = {
    id: '10565',
    sashType: 'fixed_in_frame',
    fillingType: 'glass',
    divider: 'horizontal',
    sections: [
        {
            id: '11152',
            sashType: 'tilt_turn_right',
            fillingType: 'glass',
            vertical_bars_number: 3,
            horizontal_bars_number: 2,
            divider: 'vertical_invisible',
            sections: [
                {
                    id: '21156',
                    sashType: 'fixed_in_frame',
                    fillingType: 'glass',
                    fillingName: 'Glass'
                },
                {
                    id: '21157',
                    sashType: 'fixed_in_frame',
                    fillingType: 'glass',
                    fillingName: 'Glass'
                }
            ],
            position: 466.72499999999997
        },
        {
            id: '11153',
            sashType: 'fixed_in_frame',
            fillingType: 'glass',
            vertical_bars_number: 3,
            horizontal_bars_number: 2
        }
    ],
    position: 923.925,
    vertical_bars_number: 3,
    horizontal_bars_number: 4
};
const root_section_json_string = JSON.stringify(root_section_data);
const preview_settings = {
    width: 500,
    height: 500,
    position: 'outside',
    hingeIndicatorMode: 'american'
};

export default {
    title: 'Unit A from MOYERS RESIDENCE',
    unit_data,
    profile_data,
    root_section_data,
    root_section_json_string,
    preview_settings,
    imgData: {chrome, firefox, phantom}
};
