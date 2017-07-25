//  ------------------------------------------------------------------------
//  Pricing schemes
//  ------------------------------------------------------------------------

export const PRICING_SCHEME_NONE = 'NONE';
export const PRICING_SCHEME_PRICING_GRIDS = 'PRICING_GRIDS';
export const PRICING_SCHEME_LINEAR_EQUATION = 'LINEAR_EQUATION';
export const PRICING_SCHEME_PER_ITEM = 'PER_ITEM';
export const PRICING_SCHEME_PER_OPERABLE_SASH = 'PER_OPERABLE_SASH';
export const PRICING_SCHEME_PER_MULLION = 'PER_MULLION';
export const PRICING_SCHEME_PER_FRAME_LENGTH = 'PER_FRAME_LENGTH';
export const PRICING_SCHEME_PER_SASH_FRAME_LENGTH = 'PER_SASH_FRAME_LENGTH';
export const PRICING_SCHEME_PER_MULLION_LENGTH = 'PER_MULLION_LENGTH';
export const PRICING_SCHEME_PER_PROFILE_LENGTH = 'PER_PROFILE_LENGTH';
export const PRICING_SCHEME_PER_GLAZING_BAR_LENGTH = 'PER_GLAZING_BAR_LENGTH';
export const PRICING_SCHEME_PER_SILL_OR_THRESHOLD_LENGTH = 'PER_SILL_OR_THRESHOLD_LENGTH';

export const PRICING_SCHEME_TITLES = {
    [PRICING_SCHEME_NONE]: 'None',
    [PRICING_SCHEME_PRICING_GRIDS]: 'Pricing Grids',
    [PRICING_SCHEME_LINEAR_EQUATION]: 'Linear Equation',
    [PRICING_SCHEME_PER_ITEM]: 'Per Item',
    [PRICING_SCHEME_PER_OPERABLE_SASH]: 'Per Operable Sash',
    [PRICING_SCHEME_PER_MULLION]: 'Per Mullion',
    [PRICING_SCHEME_PER_FRAME_LENGTH]: 'Per Frame Length',
    [PRICING_SCHEME_PER_SASH_FRAME_LENGTH]: 'Per Sash Frame Length',
    [PRICING_SCHEME_PER_MULLION_LENGTH]: 'Per Mullion Length',
    [PRICING_SCHEME_PER_PROFILE_LENGTH]: 'Per Profile Length',
    [PRICING_SCHEME_PER_GLAZING_BAR_LENGTH]: 'Per Glazing Bar Length',
    [PRICING_SCHEME_PER_SILL_OR_THRESHOLD_LENGTH]: 'Per Sill / Threshold Length',
};

//  ------------------------------------------------------------------------
//  Rules and restrictions (Dictionary attributes)
//  ------------------------------------------------------------------------

export const RULE_DOOR_ONLY = 'DOOR_ONLY';
export const RULE_OPERABLE_ONLY = 'OPERABLE_ONLY';
export const RULE_GLAZING_BARS_ONLY = 'GLAZING_BARS_ONLY';
export const RULE_IS_OPTIONAL = 'IS_OPTIONAL';

export const RULE_TITLES = {
    [RULE_DOOR_ONLY]: 'Only for Doors',
    [RULE_OPERABLE_ONLY]: 'Only if has Operable Sashes',
    [RULE_GLAZING_BARS_ONLY]: 'Only if has Glazing Bars',
    [RULE_IS_OPTIONAL]: 'Is Optional',
};

//  ------------------------------------------------------------------------
//  Common string values
//  ------------------------------------------------------------------------

export const UNSET_VALUE = '--';
export const DATE_FORMAT_MOMENTJS = 'D MMMM, YYYY';
export const DATE_FORMAT_BS_DATEPICKER = 'd MM, yyyy';

//  ------------------------------------------------------------------------
//  Key codes
//  ------------------------------------------------------------------------

export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_CTRL = 17;
export const KEY_Y = 89;
export const KEY_Z = 90;
export const KEY_N = 78;

//  ------------------------------------------------------------------------
//  UI error messages (for HoT tables and some other places)
//  ------------------------------------------------------------------------

export const VALUE_ERROR_DOORS_ONLY = '(Doors Only)';
export const VALUE_ERROR_OPERABLE_ONLY = '(Operable Only)';
export const VALUE_ERROR_GLAZING_BARS_ONLY = '(Has no Bars)';
export const VALUE_ERROR_NONE = '(None)';
export const VALUE_ERROR_NO_VARIANTS = '(No Variants)';
export const VALUE_ERROR_NO_PROFILE = '(No Profile)';
