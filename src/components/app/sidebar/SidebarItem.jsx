import PropTypes from "prop-types";
import { NavLink, useLocation } from "react-router-dom";

const propTypes = {
    to: PropTypes.string,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    onClick: PropTypes.func,
};

export default function SidebarItem(props) {
    const {
        to = null,
        icon: Icon,
        label,
        isExpanded,
        onClick = null
    } = props

    const location = useLocation()
    const isActive = to ? location.pathname === to : false

    const content = (
        <div
            className={ `flex items-center p-2 rounded gap-3 transition-colors duration-500 ${
                isActive
                    ? "bg-blue-100 dark:bg-blue-800"
                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
            }` }
        >
            <Icon className="text-xl text-zinc-900 dark:text-white" />
            { isExpanded && <span className="text-zinc-900 dark:text-white font-semibold">{ label }</span> }
        </div>
    );

    return to ? (
        <NavLink to={ to } className="block w-full">
            { content }
        </NavLink>
    ) : (
        <div onClick={ onClick } className="w-full text-left cursor-pointer">
            { content }
        </div>
    );
}

SidebarItem.propTypes = propTypes;
