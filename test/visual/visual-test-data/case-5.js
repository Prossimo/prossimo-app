import chrome from './case-5-chrome.png';
import firefox from './case-5-firefox.png';
import phantom from './case-5-phantom.png';

const unit_data = {
    mark: 'C1',
    width: 38,
    height: 78,
    opening_direction: 'Inward',
};
const profile_data = {
    name: 'Workhorse uPVC',
    unit_type: 'Window',
    frame_width: 66,
    mullion_width: 82,
    sash_frame_width: 76,
    sash_frame_overlap: 26,
    sash_mullion_overlap: 8,
    threshold_width: 20,
    low_threshold: false,
};
const root_section_data = {
    id: '8122',
    sashType: 'fixed_in_frame',
    fillingType: 'glass',
    divider: 'horizontal',
    sections: [
        {
            id: '8649',
            sashType: 'fixed_in_frame',
            fillingType: 'glass',
            arched: true,
            fillingName: 'Triple - U=.09 SGHC=.5 VT=.71',
            bars: {
                vertical: [],
                horizontal: [],
            },
        },
        {
            id: '8650',
            sashType: 'fixed_in_frame',
            fillingType: 'glass',
            divider: 'horizontal',
            sections: [
                {
                    id: '8651',
                    sashType: 'tilt_turn_left',
                    fillingType: 'glass',
                    fillingName: 'Triple - U=.09 SGHC=.5 VT=.71',
                    bars: {
                        vertical: [],
                        horizontal: [],
                    },
                },
                {
                    id: '8652',
                    sashType: 'turn_only_left',
                    fillingType: 'glass',
                    fillingName: 'Triple - U=.09 SGHC=.5 VT=.71',
                    bars: {
                        vertical: [],
                        horizontal: [],
                    },
                },
            ],
            position: 1447.7999999999997,
            fillingName: 'Triple - U=.09 SGHC=.5 VT=.71',
            bars: {
                vertical: [],
                horizontal: [],
            },
        },
    ],
    position: 508,
    fillingName: 'Triple - U=.09 SGHC=.5 VT=.71',
    bars: {
        vertical: [],
        horizontal: [],
    },
};
const root_section_json_string = JSON.stringify(root_section_data);
const preview_settings = {
    width: 500,
    height: 500,
    position: 'inside',
    hingeIndicatorMode: 'american',
};

export default {
    title: 'Unit C1 from 377 E 10th',
    unit_data,
    profile_data,
    root_section_data,
    root_section_json_string,
    preview_settings,
    imgData: { chrome, firefox, phantom },
};
