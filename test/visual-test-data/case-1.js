/* eslint quotes:0 */
/* jscs:disable */

var case_data_array = case_data_array || [];

(function () {
    'use strict';

    var case_data = {
        title: 'Unit A from fixtures with additional glazing bars'
    };

    case_data.unit_data = {
        width: 62,
        height: 96
    };

    case_data.profile_data = {
        frame_width: 70,
        mullion_width: 92,
        sash_frame_width: 82,
        sash_frame_overlap: 34,
        sash_mullion_overlap: 12,
        unit_type: 'Window'
    };

    case_data.root_section_data = {
        "id": "264",
        "sashType": "fixed_in_frame",
        "fillingType": "glass",
        "fillingName": "Glass",
        "bars": {
            "vertical": [
                {
                    "position": 478.26666666666665
                },
                {
                    "position": 956.5333333333333
                }
            ],
            "horizontal": [
                {
                    "position": 766.1333333333332
                },
                {
                    "position": 1532.2666666666664
                }
            ]
        }
    };

    case_data.root_section_json_string = JSON.stringify(case_data.root_section_data);

    case_data.preview_settings = {
        width: 500,
        height: 500,
        position: 'inside',
        hingeIndicatorMode: 'american'
    };

    case_data.expected_image_filename = 'case-1.png';

    case_data_array.push(case_data);
})();
