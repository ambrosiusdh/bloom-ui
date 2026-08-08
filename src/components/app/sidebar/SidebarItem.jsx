import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";

const propTypes = {
    to: PropTypes.string,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    end: PropTypes.bool,
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
        end = false,
        itemRef = null,
        onClick = null,
        state = null
    } = props

    const className = isActive => `
            flex
            font-semibold
            items-center 
            w-full
            p-2
            rounded
            gap-3 
            transition-colors 
            duration-200
            whitespace-nowrap
            focus-visible:outline
            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-white
            ${
                isActive
                    ? "bg-white text-maroon-700"
                    : "text-white hover:bg-maroon-700"
            }`;

    const content = (
        <>
            <Icon
                aria-hidden="true"
                className="shrink-0 text-xl"
            />
            <span className={ isExpanded ? "font-semibold" : "sr-only" }>
                { label }
            </span>
        </>
    );

    return to ? (
        <NavLink
            ref={ itemRef }
            to={ to }
            state={ state }
            end={ end }
            title={ isExpanded ? undefined : label }
            className={ ({ isActive }) => className(isActive) }
            onClick={ onClick }
        >
            { content }
        </NavLink>
    ) : (
        <button
            ref={ itemRef }
            type="button"
            title={ isExpanded ? undefined : label }
            className={ `${className(false)} bg-transparent hover:border-transparent` }
            onClick={ onClick }
        >
            { content }
        </button>
    );
}

SidebarItem.propTypes = propTypes;
