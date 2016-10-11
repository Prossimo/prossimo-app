/* eslint quotes:0 */
/* jscs:disable */

var case_data_array = case_data_array || [];

(function () {
    'use strict';

    var case_data = {
        title: 'Unit ED01> from Placetailor - Thornton Manor'
    };

    case_data.unit_data = {
        mark: "ED01>",
        width: 42,
        height: 84,
        opening_direction: "Inward"
    };

    case_data.profile_data = {
        name: "THERMO DOOR",
        unit_type: "Entry Door",
        frame_width: 69.5,
        mullion_width: 94,
        sash_frame_width: 94.5,
        sash_frame_overlap: 45,
        sash_mullion_overlap: 12,
        threshold_width: 20,
        low_threshold: true
    };

    case_data.root_section_data = {
        "id": "15691",
        "sashType": "turn_only_left",
        "fillingType": "full-flush-panel",
        "fillingName": "Full Flush Foam Filled Aluminum"
    };

    case_data.root_section_json_string = JSON.stringify(case_data.root_section_data);

    case_data.preview_settings = {
        width: 500,
        height: 500,
        position: 'inside',
        hingeIndicatorMode: 'american'
    };

    case_data.expected_image_filename = 'case-4.png';

    case_data_array.push(case_data);
})();
