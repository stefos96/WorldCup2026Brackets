import {useEffect} from 'react';
import './scss/logo.scss'; // Inject SCSS Stylesheets


export function Logo() {

    // Automatically make the materials highly reflective and slightly emissive
    useEffect(() => {
    }, []);

    return (
        <div className="logo-wrapper">
            <img src="/logo.png" alt="logo.png"/>
        </div>
    );
}