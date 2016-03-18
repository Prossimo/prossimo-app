/* eslint quotes:0 */
/* jscs:disable */

var case_data_array = case_data_array || [];

(function () {
    'use strict';

    var case_data = {
        title: 'Unit H/I from 11 W126th'
    };

    case_data.unit_data = {
        mark: "H/I",
        width: 145,
        height: 90,
        opening_direction: "Outward",
        glazing_bar_width: 12
    };

    case_data.profile_data = {
        name: "PE 78N HI Entry Door",
        unit_type: "Entry Door",
        frame_width: 74,
        mullion_width: 94,
        sash_frame_width: 126,
        sash_frame_overlap: 28,
        sash_mullion_overlap: 12,
        threshold_width: 20,
        low_threshold: true
    };

    case_data.root_section_data = {
        "id": "19991",
        "sashType": "fixed_in_frame",
        "fillingType": "glass",
        "fillingName": "Triple Low Gain - Tempered",
        "divider": "vertical",
        "sections": [
            {
                "id": "21048",
                "sashType": "fixed_in_frame",
                "fillingType": "glass",
                "fillingName": "Triple Low Gain - Tempered",
                "divider": "vertical",
                "sections": [
                    {
                        "id": "21050",
                        "sashType": "fixed_in_frame",
                        "fillingType": "glass",
                        "fillingName": "Triple Low Gain - Tempered",
                        "divider": "horizontal",
                        "sections": [
                            {
                                "id": "21064",
                                "sashType": "fixed_in_frame",
                                "fillingType": "glass",
                                "fillingName": "Triple Low Gain - Tempered"
                            },
                            {
                                "id": "21065",
                                "sashType": "fixed_in_frame",
                                "fillingType": "glass",
                                "fillingName": "Triple Low Gain - Tempered"
                            }
                        ],
                        "position": 1498.6
                    },
                    {
                        "id": "21051",
                        "sashType": "turn_only_right",
                        "fillingType": "glass",
                        "fillingName": "Triple Low Gain - Tempered"
                    }
                ],
                "position": 717.55
            },
            {
                "id": "21049",
                "sashType": "fixed_in_frame",
                "fillingType": "glass",
                "fillingName": "Triple Low Gain - Tempered",
                "divider": "vertical",
                "sections": [
                    {
                        "id": "21066",
                        "sashType": "turn_only_left",
                        "fillingType": "glass",
                        "fillingName": "Triple Low Gain - Tempered"
                    },
                    {
                        "id": "21067",
                        "sashType": "fixed_in_frame",
                        "fillingType": "glass",
                        "fillingName": "Triple Low Gain - Tempered",
                        "divider": "horizontal",
                        "sections": [
                            {
                                "id": "21068",
                                "sashType": "fixed_in_frame",
                                "fillingType": "glass",
                                "fillingName": "Triple Low Gain - Tempered"
                            },
                            {
                                "id": "21069",
                                "sashType": "fixed_in_frame",
                                "fillingType": "glass",
                                "fillingName": "Triple Low Gain - Tempered"
                            }
                        ],
                        "position": 1498.6
                    }
                ],
                "position": 2686.05
            }
        ],
        "position": 1701.8000000000002
    };

    case_data.root_section_json_string = JSON.stringify(case_data.root_section_data);

    case_data.preview_settings = {
        width: 500,
        height: 500,
        position: 'outside',
        hingeIndicatorMode: 'american'
    };

    case_data.expected_image_filename = 'case-2.png';

    case_data_array.push(case_data);
})();
