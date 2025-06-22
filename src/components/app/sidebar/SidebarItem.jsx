import PropTypes from "prop-types";

export default function SidebarItem({ icon, label, isExpanded }) {
    SidebarItem.propTypes = {
        icon: PropTypes.node.isRequired,
        label: PropTypes.string.isRequired,
        isExpanded: PropTypes.bool.isRequired
    }

    return (
        <div
            className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-700 cursor-pointer transition">
            <div className="text-xl text-blue-600 dark:text-blue-400">{ icon }</div>
            { isExpanded && <span className="text-sm">{ label }</span> }
        </div>
    );
}