use wgui::{WguiModel, wgui_controller};

use crate::shared::*;

#[derive(Debug, Clone, WguiModel)]
pub(crate) struct DiagnosticsModel {
    shell: ShellModel,
    panel_entry: String,
    robot_props: wgui::wui::runtime::WuiValue,
    chart_props: wgui::wui::runtime::WuiValue,
    health: Vec<StatCardModel>,
    motors: Vec<StatusLineModel>,
    sensors: Vec<StatusLineModel>,
    faults: Vec<TableRowModel>,
    logs: Vec<LogLineModel>,
}

pub(crate) struct DiagnosticsController;

#[wgui_controller(template = "diagnostics_controller")]
impl DiagnosticsController {
    pub(crate) fn new() -> Self {
        Self
    }

    pub(crate) fn state(&self) -> DiagnosticsModel {
        DiagnosticsModel {
            shell: shell("diagnostics", robot_trail("Diagnostics")),
            panel_entry: PANEL_CONTROLLER_ENTRY.to_string(),
            robot_props: panel_props("robot"),
            chart_props: panel_props("diagnostic_chart"),
            health: vec![
                stat_card("Battery", "78%", "2h 15m remaining", "#36d67a"),
                stat_card("Temperature", "42 C", "System avg.", "#36d67a"),
                stat_card("Network", "32 ms", "Latency", "#36d67a"),
            ],
            motors: vec![
                status_line("Left Shoulder", "41 C", "", "#36d67a"),
                status_line("Right Shoulder", "39 C", "", "#36d67a"),
                status_line("Left Hip", "42 C", "", "#c8d94a"),
                status_line("Right Hip", "43 C", "", "#c8d94a"),
                status_line("Left Knee", "45 C", "", "#ffbb3c"),
                status_line("Right Knee", "44 C", "", "#ffbb3c"),
            ],
            sensors: vec![
                status_line("IMU", "OK", "", "#36d67a"),
                status_line("Camera Front", "OK", "", "#36d67a"),
                status_line("Camera Rear", "OK", "", "#36d67a"),
                status_line("LIDAR", "OK", "", "#36d67a"),
                status_line("Joint Encoders", "OK", "", "#36d67a"),
                status_line("Battery BMS", "OK", "", "#36d67a"),
            ],
            faults: vec![
                table_row(
                    "May 19, 11:02 AM",
                    "WARN",
                    "Right Knee Motor",
                    "Resolved",
                    "",
                    "#ffbb3c",
                ),
                table_row(
                    "May 19, 10:45 AM",
                    "WARN",
                    "Battery BMS",
                    "Resolved",
                    "",
                    "#ffbb3c",
                ),
                table_row(
                    "May 18, 04:33 PM",
                    "INFO",
                    "Left Elbow Motor",
                    "Resolved",
                    "",
                    "#5da2ff",
                ),
            ],
            logs: vec![
                log_line("12:12:41", "INFO", "System health check passed", "#5da2ff"),
                log_line("12:12:38", "INFO", "Motors temperature normal", "#36d67a"),
                log_line("12:12:35", "WARN", "High CPU usage detected", "#ffbb3c"),
                log_line("12:12:32", "INFO", "Battery level: 78%", "#5da2ff"),
            ],
        }
    }
}
