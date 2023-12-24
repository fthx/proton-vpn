//    Proton VPN Button
//    GNOME Shell extension
//    @fthx 2023


import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';


const BUTTON_LOW_OPACITY = 124;

const ProtonVPNButton = GObject.registerClass(
class ProtonVPNButton extends PanelMenu.Button {
    _init() {
        super._init();

        this._box = new St.BoxLayout({reactive: true, style_class: 'panel-button'});

        this._desaturate_effect = new Clutter.DesaturateEffect();
        this.add_effect(this._desaturate_effect);
        this._icon = new St.Icon({style_class: 'system-status-icon'});

        this._box.add_child(this._icon);
        this.add_child(this._box);
    }
});

export default class ProtonVPNButtonExtension {
    _get_app() {
        this._app = Shell.AppSystem.get_default().lookup_app('protonvpn-app.desktop');
        if (!this._app) {
            Main.notify('Extension warning: Proton VPN app not found');
            return;
        }

        this._app.connectObject('windows-changed', this._init_button.bind(this), this);
    }

    _init_button() {
        this._icon = this._app.get_icon();
        this._button._icon.set_gicon(this._app.get_icon());

        if (this._app.get_windows().length > 0) {
            this._button._icon.set_opacity(255);
            this._button.remove_effect(this._button._desaturate_effect);
            this._window = this._app.get_windows()[0];
            this._window.minimize();
        } else {
            this._button._icon.set_opacity(BUTTON_LOW_OPACITY);
            this._button.add_effect(this._button._desaturate_effect);
        }
    }

    _on_clicked() {
        if (this._app.get_windows().length > 0 && this._window) {
            if (this._window.minimized) {
                this._window.activate(global.get_current_time());
            } else {
                this._window.minimize();
            }
        } else {
            this._app.activate();
        }
    }

    enable() {
        this._button = new ProtonVPNButton();
        this._get_app();
        this._init_button();
        Main.panel.addToStatusArea('Proton VPN button', this._button, 0);

        this._button.connectObject('button-release-event', this._on_clicked.bind(this), this);
    }

    disable() {
        if (this._app) {
            this._app.disconnectObject(this);
        }

        this._button.disconnectObject(this);
        this._button.destroy();
        this._button = null;
    }
}
