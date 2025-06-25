import { Button } from "@mui/material";
import PropTypes from "prop-types";

const propTypes = {
    variant: PropTypes.string,
    disabled: PropTypes.bool,
    onClick: PropTypes.func,
};

export default function BloomButton (props) {
    const {
        variant = 'contained',
        disabled = false,
        onClick
    } = props
    return (
        <Button variant={ variant } onClick={ onClick } disabled={ disabled }></Button>
    )
}

BloomButton.propTypes = propTypes