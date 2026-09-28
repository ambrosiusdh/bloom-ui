import { Link } from "react-router-dom";
import PropTypes from "prop-types";

const propTypes = {
    to: PropTypes.string,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    isSelected: PropTypes.bool,
    itemRef: PropTypes.shape({ current: PropTypes.object }),
    onClick: PropTypes.func,
    state: PropTypes.object,
};

export default function SidebarItem(props) {
    const {
        to = null,
        icon: Icon,
        label,
        isExpanded,
        isSelected = false,
        itemRef = null,
        onClick = null,
        state = null
    } = props

    const className = [
        'bloom-sidebar-item',
        isSelected ? 'bloom-sidebar-item--selected' : ''
    ].filter(Boolean).join(' ');

    const content = (
        <>
            <Icon
                aria-hidden="true"
                className="bloom-sidebar-item__icon"
            />
            <span className={ isExpanded ? 'bloom-sidebar-item__label' : 'sr-only' }>
                { label }
            </span>
        </>
    );

    return to ? (
        <Link
            ref={ itemRef }
            to={ to }
            state={ state }
            aria-current={ isSelected ? 'page' : undefined }
            title={ isExpanded ? undefined : label }
            className={ className }
            onClick={ onClick }
        >
            { content }
        </Link>
    ) : (
        <button
            ref={ itemRef }
            type="button"
            title={ isExpanded ? undefined : label }
            className={ className }
            onClick={ onClick }
        >
            { content }
        </button>
    );
}

SidebarItem.propTypes = propTypes;
