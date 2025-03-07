"""Unicode Properties."""
from __future__ import annotations
from . import unidata

UNICODE_RANGE = '\u0000-\U0010ffff'
ASCII_RANGE = '\x00-\xff'

MODE_NORMAL = 0
MODE_ASCII = 1
MODE_UNICODE = 2


def fmt_string(value: str, is_bytes: bool) -> str:
    """Format for bytes string."""

    if is_bytes:
        return value[:-1] + '\xff' if value.endswith('\U0010ffff') else value
    else:
        return value


def get_gc_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `GC` property."""

    obj = unidata.ascii_properties if mode != MODE_UNICODE else unidata.unicode_properties

    if value.startswith('^'):
        negate = True
        value = value[1:]
    else:
        negate = False

    value = unidata.unicode_alias['generalcategory'].get(value, value)
    is_binary = mode == MODE_ASCII

    length = len(value)
    if length < 1 or length > 2:
        raise ValueError('Invalid property')
    elif length == 1 and value not in obj:
        raise ValueError('Invalid property')
    elif length == 2 and (value[0] not in obj or value[1] not in obj[value[0]]):
        raise ValueError('Invalid property')

    if not negate:
        p1, p2 = (value[0], value[1]) if len(value) > 1 else (value[0], None)
        value = ''.join(
            [fmt_string(v, is_binary) for k, v in obj.get(p1, {}).items() if not k.startswith('^')]
        ) if p2 is None else fmt_string(obj.get(p1, {}).get(p2, ''), is_binary)
    else:
        p1, p2 = (value[0], value[1]) if len(value) > 1 else (value[0], '')
        value = fmt_string(obj.get(p1, {}).get('^' + p2, ''), is_binary)
    return value


def get_binary_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `BINARY` property."""

    obj = unidata.ascii_binary if mode != MODE_UNICODE else unidata.unicode_binary

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['binary'].get(negated, negated)
    else:
        value = unidata.unicode_alias['binary'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_canonical_combining_class_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `CANONICAL COMBINING CLASS` property."""

    obj = unidata.ascii_canonical_combining_class if mode != MODE_UNICODE else unidata.unicode_canonical_combining_class

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['canonicalcombiningclass'].get(negated, negated)
    else:
        value = unidata.unicode_alias['canonicalcombiningclass'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_east_asian_width_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `EAST ASIAN WIDTH` property."""

    obj = unidata.ascii_east_asian_width if mode != MODE_UNICODE else unidata.unicode_east_asian_width

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['eastasianwidth'].get(negated, negated)
    else:
        value = unidata.unicode_alias['eastasianwidth'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_grapheme_cluster_break_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `GRAPHEME CLUSTER BREAK` property."""

    obj = unidata.ascii_grapheme_cluster_break if mode != MODE_UNICODE else unidata.unicode_grapheme_cluster_break

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['graphemeclusterbreak'].get(negated, negated)
    else:
        value = unidata.unicode_alias['graphemeclusterbreak'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_line_break_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `LINE BREAK` property."""

    obj = unidata.ascii_line_break if mode != MODE_UNICODE else unidata.unicode_line_break

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['linebreak'].get(negated, negated)
    else:
        value = unidata.unicode_alias['linebreak'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_sentence_break_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `SENTENCE BREAK` property."""

    obj = unidata.ascii_sentence_break if mode != MODE_UNICODE else unidata.unicode_sentence_break

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['sentencebreak'].get(negated, negated)
    else:
        value = unidata.unicode_alias['sentencebreak'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_word_break_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `WORD BREAK` property."""

    obj = unidata.ascii_word_break if mode != MODE_UNICODE else unidata.unicode_word_break

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['wordbreak'].get(negated, negated)
    else:
        value = unidata.unicode_alias['wordbreak'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_hangul_syllable_type_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `HANGUL SYLLABLE TYPE` property."""

    obj = unidata.ascii_hangul_syllable_type if mode != MODE_UNICODE else unidata.unicode_hangul_syllable_type

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['hangulsyllabletype'].get(negated, negated)
    else:
        value = unidata.unicode_alias['hangulsyllabletype'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_indic_positional_category_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `INDIC POSITIONAL/MATRA CATEGORY` property."""

    obj = unidata.ascii_indic_positional_category if mode != MODE_UNICODE else unidata.unicode_indic_positional_category
    alias_key = 'indicpositionalcategory'

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias[alias_key].get(negated, negated)
    else:
        value = unidata.unicode_alias[alias_key].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_indic_syllabic_category_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `INDIC SYLLABIC CATEGORY` property."""

    obj = unidata.ascii_indic_syllabic_category if mode != MODE_UNICODE else unidata.unicode_indic_syllabic_category

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['indicsyllabiccategory'].get(negated, negated)
    else:
        value = unidata.unicode_alias['indicsyllabiccategory'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_decomposition_type_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `DECOMPOSITION TYPE` property."""

    obj = unidata.ascii_decomposition_type if mode != MODE_UNICODE else unidata.unicode_decomposition_type

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['decompositiontype'].get(negated, negated)
    else:
        value = unidata.unicode_alias['decompositiontype'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_nfc_quick_check_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `NFC QUICK CHECK` property."""

    obj = unidata.ascii_nfc_quick_check if mode != MODE_UNICODE else unidata.unicode_nfc_quick_check

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['nfcquickcheck'].get(negated, negated)
    else:
        value = unidata.unicode_alias['nfcquickcheck'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_nfd_quick_check_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `NFD QUICK CHECK` property."""

    obj = unidata.ascii_nfd_quick_check if mode != MODE_UNICODE else unidata.unicode_nfd_quick_check

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['nfdquickcheck'].get(negated, negated)
    else:
        value = unidata.unicode_alias['nfdquickcheck'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_nfkc_quick_check_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `NFKC QUICK CHECK` property."""

    obj = unidata.ascii_nfkc_quick_check if mode != MODE_UNICODE else unidata.unicode_nfkc_quick_check

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['nfkcquickcheck'].get(negated, negated)
    else:
        value = unidata.unicode_alias['nfkcquickcheck'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_nfkd_quick_check_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `NFKD QUICK CHECK` property."""

    obj = unidata.ascii_nfkd_quick_check if mode != MODE_UNICODE else unidata.unicode_nfkd_quick_check

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['nfkdquickcheck'].get(negated, negated)
    else:
        value = unidata.unicode_alias['nfkdquickcheck'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_numeric_type_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `NUMERIC TYPE` property."""

    obj = unidata.ascii_numeric_type if mode != MODE_UNICODE else unidata.unicode_numeric_type

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['numerictype'].get(negated, negated)
    else:
        value = unidata.unicode_alias['numerictype'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_numeric_value_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `NUMERIC VALUE` property."""

    obj = unidata.ascii_numeric_values if mode != MODE_UNICODE else unidata.unicode_numeric_values

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['numericvalue'].get(negated, negated)
    else:
        value = unidata.unicode_alias['numericvalue'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_age_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `AGE` property."""

    obj = unidata.ascii_age if mode != MODE_UNICODE else unidata.unicode_age

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['age'].get(negated, negated)
    else:
        value = unidata.unicode_alias['age'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_joining_type_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `JOINING TYPE` property."""

    obj = unidata.ascii_joining_type if mode != MODE_UNICODE else unidata.unicode_joining_type

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['joiningtype'].get(negated, negated)
    else:
        value = unidata.unicode_alias['joiningtype'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_joining_group_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `JOINING GROUP` property."""

    obj = unidata.ascii_joining_group if mode != MODE_UNICODE else unidata.unicode_joining_group

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['joininggroup'].get(negated, negated)
    else:
        value = unidata.unicode_alias['joininggroup'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_script_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `SC` property."""

    obj = unidata.ascii_scripts if mode != MODE_UNICODE else unidata.unicode_scripts

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['script'].get(negated, negated)
    else:
        value = unidata.unicode_alias['script'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_script_extension_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `SCX` property."""

    obj = unidata.ascii_script_extensions if mode != MODE_UNICODE else unidata.unicode_script_extensions

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['script'].get(negated, negated)
    else:
        value = unidata.unicode_alias['script'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_block_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `BLK` property."""

    obj = unidata.ascii_blocks if mode != MODE_UNICODE else unidata.unicode_blocks

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['block'].get(negated, negated)
    else:
        value = unidata.unicode_alias['block'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_bidi_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `BC` property."""

    obj = unidata.ascii_bidi_classes if mode != MODE_UNICODE else unidata.unicode_bidi_classes

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['bidiclass'].get(negated, negated)
    else:
        value = unidata.unicode_alias['bidiclass'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_bidi_paired_bracket_type_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `BPT` property."""

    obj = unidata.ascii_bidi_paired_bracket_type if mode != MODE_UNICODE else unidata.unicode_bidi_paired_bracket_type

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['bidipairedbrackettype'].get(negated, negated)
    else:
        value = unidata.unicode_alias['bidipairedbrackettype'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_vertical_orientation_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get `VO` property."""

    if mode != MODE_UNICODE:
        obj = unidata.ascii_vertical_orientation  # type: ignore[attr-defined]
    else:
        obj = unidata.unicode_vertical_orientation  # type: ignore[attr-defined]

    if value.startswith('^'):
        negated = value[1:]
        value = '^' + unidata.unicode_alias['verticalorientation'].get(negated, negated)
    else:
        value = unidata.unicode_alias['verticalorientation'].get(value, value)

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_is_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get shortcut for `SC` or `Binary` property."""

    if value.startswith('^'):
        prefix = value[1:3]
        temp = value[3:]
        negate = '^'
    else:
        prefix = value[:2]
        temp = value[2:]
        negate = ''

    if prefix != 'is':
        raise ValueError("Does not start with 'is'!")

    script_obj = unidata.ascii_script_extensions if mode != MODE_UNICODE else unidata.unicode_script_extensions
    bin_obj = unidata.ascii_binary if mode != MODE_UNICODE else unidata.unicode_binary

    value = negate + unidata.unicode_alias['script'].get(temp, temp)

    if value not in script_obj:
        value = negate + unidata.unicode_alias['binary'].get(temp, temp)
        obj = bin_obj
    else:
        obj = script_obj

    return fmt_string(obj[value], mode == MODE_ASCII)


def get_in_property(value: str, mode: int = MODE_UNICODE) -> str:
    """Get shortcut for `Block` property."""

    if value.startswith('^'):
        prefix = value[1:3]
        temp = value[3:]
        negate = '^'
    else:
        prefix = value[:2]
        temp = value[2:]
        negate = ''

    if prefix != 'in':
        raise ValueError("Does not start with 'in'!")

    value = negate + unidata.unicode_alias['block'].get(temp, temp)
    obj = unidata.ascii_blocks if mode != MODE_UNICODE else unidata.unicode_blocks

    return fmt_string(obj[value], mode == MODE_ASCII)


def _is_binary(name: str) -> bool:
    """Check if name is an enum (not a binary) property."""

    return name in unidata.unicode_binary or name in unidata.unicode_alias['binary']


def get_unicode_property(prop: str, value: str | None = None, mode: int = MODE_UNICODE) -> str:
    """Retrieve the Unicode category from the table."""

    if value is not None:

        negate = prop.startswith('^')

        # Normalize binary true/false input so we can handle it properly
        if _is_binary(prop):
            name = prop[1:] if negate else prop

            if value in ('n', 'no', 'f', 'false'):
                negate = not negate
            elif value not in ('y', 'yes', 't', 'true'):
                raise ValueError(f"'{value}' is not a valid value for the binary property '{prop}'")

            return get_binary_property('^' + name if negate else name, mode)
        else:
            if negate:
                value = '^' + value
                name = prop[1:]
            else:
                name = prop

        name = unidata.unicode_alias['_'].get(name, name)
        try:
            if name == 'generalcategory':
                return get_gc_property(value, mode)
            elif name == 'script':
                return get_script_property(value, mode)
            elif name == 'scriptextensions':
                return get_script_extension_property(value, mode)
            elif name == 'block':
                return get_block_property(value, mode)
            elif name == 'bidiclass':
                return get_bidi_property(value, mode)
            elif name == 'bidipairedbrackettype':
                return get_bidi_paired_bracket_type_property(value, mode)
            elif name == 'age':
                return get_age_property(value, mode)
            elif name == 'eastasianwidth':
                return get_east_asian_width_property(value, mode)
            elif name == 'indicpositionalcategory':
                return get_indic_positional_category_property(value, mode)
            elif name == 'indicsyllabiccategory':
                return get_indic_syllabic_category_property(value, mode)
            elif name == 'hangulsyllabletype':
                return get_hangul_syllable_type_property(value, mode)
            elif name == 'decompositiontype':
                return get_decomposition_type_property(value, mode)
            elif name == 'canonicalcombiningclass':
                return get_canonical_combining_class_property(value, mode)
            elif name == 'numerictype':
                return get_numeric_type_property(value, mode)
            elif name == 'numericvalue':
                return get_numeric_value_property(value, mode)
            elif name == 'joiningtype':
                return get_joining_type_property(value, mode)
            elif name == 'joininggroup':
                return get_joining_group_property(value, mode)
            elif name == 'graphemeclusterbreak':
                return get_grapheme_cluster_break_property(value, mode)
            elif name == 'linebreak':
                return get_line_break_property(value, mode)
            elif name == 'sentencebreak':
                return get_sentence_break_property(value, mode)
            elif name == 'wordbreak':
                return get_word_break_property(value, mode)
            elif name == 'nfcquickcheck':
                return get_nfc_quick_check_property(value, mode)
            elif name == 'nfdquickcheck':
                return get_nfd_quick_check_property(value, mode)
            elif name == 'nfkcquickcheck':
                return get_nfkc_quick_check_property(value, mode)
            elif name == 'nfkdquickcheck':
                return get_nfkd_quick_check_property(value, mode)
            elif name == 'verticalorientation':
                return get_vertical_orientation_property(value, mode)
            else:
                raise ValueError(f"'{prop}={value}' does not have a valid property name")
        except Exception as e:
            raise ValueError(f"'{prop}={value}' does not appear to be a valid property") from e

    try:
        return get_gc_property(prop, mode)
    except Exception:
        pass

    try:
        return get_script_extension_property(prop, mode)
    except Exception:
        pass

    try:
        return get_binary_property(prop, mode)
    except Exception:
        pass

    try:
        return get_block_property(prop, mode)
    except Exception:
        pass

    try:
        return get_is_property(prop, mode)
    except Exception:
        pass

    try:
        return get_in_property(prop, mode)
    except Exception:
        pass

    raise ValueError(f"'{prop}' does not appear to be a valid property")
