import { NavLink, useLocation } from "react-router-dom";
import PropTypes from "prop-types";

const propTypes = {
    to: PropTypes.string,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    onClick: PropTypes.func,
    state: PropTypes.object,
};

export default function SidebarItem(props) {
    const {
        to = null,
        icon: Icon,
        label,
        isExpanded,
        onClick = null,
        state = null
    } = props

    const location = useLocation()
    const isActive = to ? location.pathname.startsWith(to) : false

    const content = (
        <div
            className={ `
            flex
            font-semibold
            items-center 
            p-2
            rounded
            gap-3 
            transition-colors 
            duration-500
            hover:cursor-pointer 
            whitespace-nowrap
            ${
                isActive
                    ? "bg-white text-maroon-700"
                    : "text-white hover:bg-maroon-700"
            }` }
        >
            <Icon className="text-xl" />
            { isExpanded && <span className="font-semibold">{ label }</span> }
        </div>
    );

    return to ? (
        <NavLink
            to={ to }
            state={ state }
            className="block w-full"
        >
            { content }
        </NavLink>
    ) : (
        <div onClick={ onClick } className="w-full text-left cursor-pointer">
            { content }
        </div>
    );
}

SidebarItem.propTypes = propTypes;
