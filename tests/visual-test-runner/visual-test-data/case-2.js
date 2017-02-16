import chrome from './case-2-chrome.png';
import firefox from './case-2-firefox.png';
import phantom from './case-2-phantom.png';

const unit_data = {
    mark: 'H/I',
    width: 145,
    height: 90,
    opening_direction: 'Outward',
    glazing_bar_width: 12
};
const profile_data = {
    name: 'PE 78N HI Entry Door',
    unit_type: 'Entry Door',
    frame_width: 74,
    mullion_width: 94,
    sash_frame_width: 126,
    sash_frame_overlap: 28,
    sash_mullion_overlap: 12,
    threshold_width: 20,
    low_threshold: true
};
const root_section_data = {
    id: '19991',
    sashType: 'fixed_in_frame',
    fillingType: 'glass',
    fillingName: 'Triple Low Gain - Tempered',
    divider: 'vertical',
    sections: [
        {
            id: '21048',
            sashType: 'fixed_in_frame',
            fillingType: 'glass',
            fillingName: 'Triple Low Gain - Tempered',
            divider: 'vertical',
            sections: [
                {
                    id: '21050',
                    sashType: 'fixed_in_frame',
                    fillingType: 'glass',
                    fillingName: 'Triple Low Gain - Tempered',
                    divider: 'horizontal',
                    sections: [
                        {
                            id: '21064',
                            sashType: 'fixed_in_frame',
                            fillingType: 'glass',
                            fillingName: 'Triple Low Gain - Tempered'
                        },
                        {
                            id: '21065',
                            sashType: 'fixed_in_frame',
                            fillingType: 'glass',
                            fillingName: 'Triple Low Gain - Tempered'
                        }
                    ],
                    position: 1498.6
                },
                {
                    id: '21051',
                    sashType: 'turn_only_right',
                    fillingType: 'glass',
                    fillingName: 'Triple Low Gain - Tempered'
                }
            ],
            position: 717.55
        },
        {
            id: '21049',
            sashType: 'fixed_in_frame',
            fillingType: 'glass',
            fillingName: 'Triple Low Gain - Tempered',
            divider: 'vertical',
            sections: [
                {
                    id: '21066',
                    sashType: 'turn_only_left',
                    fillingType: 'glass',
                    fillingName: 'Triple Low Gain - Tempered'
                },
                {
                    id: '21067',
                    sashType: 'fixed_in_frame',
                    fillingType: 'glass',
                    fillingName: 'Triple Low Gain - Tempered',
                    divider: 'horizontal',
                    sections: [
                        {
                            id: '21068',
                            sashType: 'fixed_in_frame',
                            fillingType: 'glass',
                            fillingName: 'Triple Low Gain - Tempered'
                        },
                        {
                            id: '21069',
                            sashType: 'fixed_in_frame',
                            fillingType: 'glass',
                            fillingName: 'Triple Low Gain - Tempered'
                        }
                    ],
                    position: 1498.6
                }
            ],
            position: 2686.05
        }
    ],
    position: 1701.8000000000002
};
const root_section_json_string = JSON.stringify(root_section_data);
const preview_settings = {
    width: 500,
    height: 500,
    position: 'outside',
    hingeIndicatorMode: 'american'
};

export default {
    title: 'Unit H/I from 11 W126th',
    unit_data,
    profile_data,
    root_section_data,
    root_section_json_string,
    preview_settings,
    imgData: {chrome, firefox, phantom}
};
