use wgui::{WguiModel, wgui_controller};

use crate::shared::*;

#[derive(Debug, Clone, WguiModel)]
pub(crate) struct SensorViewModel {
    name: String,
    component_name: String,
    props: wgui::wui::runtime::WuiValue,
}

#[derive(Debug, Clone, WguiModel)]
pub(crate) struct TeleopModel {
    shell: ShellModel,
    panel_entry: String,
    live_view_props: wgui::wui::runtime::WuiValue,
    robot_preview_props: wgui::wui::runtime::WuiValue,
    map_props: wgui::wui::runtime::WuiValue,
    arm_props: wgui::wui::runtime::WuiValue,
    hand_props: wgui::wui::runtime::WuiValue,
    timeline_props: wgui::wui::runtime::WuiValue,
    robot_status: Vec<StatusLineModel>,
    joint_status: Vec<StatusLineModel>,
    logs: Vec<LogLineModel>,
    sensors: Vec<StatusLineModel>,
    sensor_views: Vec<SensorViewModel>,
    actions: Vec<StatusLineModel>,
}

pub(crate) struct TeleopController;

fn sensor_view(name: &str, mode: &str) -> SensorViewModel {
    SensorViewModel {
        name: name.to_string(),
        component_name: format!("sensor-{}", mode.replace('_', "-")),
        props: panel_props(mode),
    }
}

#[wgui_controller(template = "teleop_controller")]
impl TeleopController {
    pub(crate) fn new() -> Self {
        Self
    }

    pub(crate) fn state(&self) -> TeleopModel {
        TeleopModel {
            shell: shell("teleop", robot_trail("Teleop")),
            panel_entry: PANEL_CONTROLLER_ENTRY.to_string(),
            live_view_props: panel_props("live"),
            robot_preview_props: panel_props("robot"),
            map_props: panel_props("map"),
            arm_props: panel_props("arm"),
            hand_props: panel_props("hand"),
            timeline_props: panel_props("timeline"),
            robot_status: vec![
                status_line("Battery", "78% 25.2 V", "", "#56e364"),
                status_line("Wi-Fi", "-62 dBm 5 GHz", "", "#8eb6d8"),
                status_line("CPU Temp", "54 C", "", "#2f89ff"),
                status_line("GPU Temp", "61 C", "", "#2f89ff"),
                status_line("Runtime", "1h 12m", "", "#8eb6d8"),
            ],
            joint_status: vec![
                status_line("L. Arm", "ok", "", "#56e364"),
                status_line("R. Arm", "ok", "", "#56e364"),
                status_line("Torso", "ok", "", "#56e364"),
                status_line("L. Leg", "ok", "", "#56e364"),
                status_line("R. Leg", "ok", "", "#56e364"),
            ],
            logs: vec![
                log_line(
                    "12:48:12.345",
                    "INFO",
                    "Teleop connected to PuppyBot-X1",
                    "#36d67a",
                ),
                log_line("12:48:12.997", "INFO", "Sensors streaming", "#36d67a"),
                log_line("12:48:15.102", "WARN", "High CPU temp: 61 C", "#ffbb3c"),
                log_line("12:48:18.453", "INFO", "Waypoint WP-02 reached", "#36d67a"),
                log_line(
                    "12:48:25.129",
                    "INFO",
                    "Recording episode ep_2025-05-12_0013",
                    "#36d67a",
                ),
            ],
            sensors: vec![
                status_line("RGB Front", "30 FPS", "18,245", "#5da2ff"),
                status_line("RGB Hand Left", "30 FPS", "18,240", "#5da2ff"),
                status_line("Depth Front", "30 FPS", "18,245", "#5da2ff"),
                status_line("LIDAR", "10 Hz", "6,083", "#5da2ff"),
                status_line("Joint States", "100 Hz", "60,982", "#5da2ff"),
            ],
            sensor_views: vec![
                sensor_view("Front RGB", "front_rgb"),
                sensor_view("Depth", "depth"),
                sensor_view("LIDAR (Top)", "lidar"),
                sensor_view("Left Hand RGB", "left_hand"),
                sensor_view("Right Hand RGB", "right_hand"),
            ],
            actions: vec![
                status_line("Save Pose", "", "", "#5da2ff"),
                status_line("Set Waypoint", "", "", "#5da2ff"),
                status_line("Go To Waypoint", "", "", "#5da2ff"),
                status_line("Take Screenshot", "", "", "#5da2ff"),
                status_line("Lock Base", "", "", "#5da2ff"),
                status_line("Reboot Robot", "", "", "#5da2ff"),
            ],
        }
    }

    pub(crate) fn title(&self) -> String {
        "PuppyOps Teleop".to_string()
    }
}
