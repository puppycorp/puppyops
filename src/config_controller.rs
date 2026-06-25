use wgui::{WguiModel, wgui_controller};

use crate::shared::*;

#[derive(Debug, Clone, WguiModel)]
pub(crate) struct ConfigModel {
    shell: ShellModel,
    panel_entry: String,
    robot_props: wgui::wui::runtime::WuiValue,
    tabs: Vec<StatusLineModel>,
    profile: Vec<StatusLineModel>,
    controls: Vec<StatusLineModel>,
    safety: Vec<StatusLineModel>,
    sensors: Vec<StatusLineModel>,
    history: Vec<TableRowModel>,
}

pub(crate) struct ConfigController;

#[wgui_controller(template = "config_controller")]
impl ConfigController {
    pub(crate) fn new() -> Self {
        Self
    }

    pub(crate) fn state(&self) -> ConfigModel {
        ConfigModel {
            shell: shell("config", robot_trail("Config")),
            panel_entry: PANEL_CONTROLLER_ENTRY.to_string(),
            robot_props: panel_props("robot"),
            tabs: [
                "Robot Profile",
                "Controls",
                "Safety Limits",
                "Cameras",
                "Sensors",
                "Network",
                "Data Collection",
                "Operators",
                "Integrations",
                "System",
            ]
            .iter()
            .map(|tab| status_line(tab, "", "", "#8eb6d8"))
            .collect(),
            profile: vec![
                status_line("Robot Name", "PuppyBot-X1", "", "#dce7f3"),
                status_line("Model", "PuppyBot-X1", "", "#dce7f3"),
                status_line("Serial Number", "PBX1-2025-0516-0013", "", "#dce7f3"),
                status_line("Default Mode", "Autonomy", "", "#dce7f3"),
                status_line("Time Zone", "America/Los_Angeles (PDT)", "", "#dce7f3"),
            ],
            controls: vec![
                status_line("Joystick Mapping", "Standard Biped", "", "#dce7f3"),
                status_line("Deadband", "5%", "", "#dce7f3"),
                status_line("Smoothing", "15%", "", "#dce7f3"),
                status_line("Max Command Rate", "50 Hz", "", "#dce7f3"),
            ],
            safety: vec![
                status_line("Max Linear Speed", "1.20 m/s", "", "#36d67a"),
                status_line("Max Angular Speed", "2.50 rad/s", "", "#36d67a"),
                status_line("Max Step Height", "0.35 m", "", "#36d67a"),
                status_line("Min Battery for Motion", "20%", "", "#36d67a"),
            ],
            sensors: vec![
                status_line("Front Cam", "1280x720", "30 FPS", "#36d67a"),
                status_line("Rear Cam", "1280x720", "30 FPS", "#36d67a"),
                status_line("IMU", "200 Hz", "ON", "#36d67a"),
                status_line("Lidar", "10 Hz", "ON", "#36d67a"),
                status_line("Battery Monitor", "1 Hz", "ON", "#36d67a"),
            ],
            history: vec![
                table_row(
                    "v2.4.1",
                    "A. Engineer",
                    "May 16, 10:15 AM",
                    "ACTIVE",
                    "",
                    "#36d67a",
                ),
                table_row(
                    "v2.4.0",
                    "A. Engineer",
                    "May 15, 4:22 PM",
                    "",
                    "",
                    "#7f8b9b",
                ),
                table_row(
                    "v2.3.2",
                    "J. Technician",
                    "May 15, 9:11 AM",
                    "",
                    "",
                    "#7f8b9b",
                ),
            ],
        }
    }
}
