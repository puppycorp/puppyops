use wgui::{WguiModel, wgui_controller};

use crate::shared::*;

#[derive(Debug, Clone, WguiModel)]
pub(crate) struct RobotsModel {
    shell: ShellModel,
    panel_entry: String,
    robot_props: wgui::wui::runtime::WuiValue,
    map_props: wgui::wui::runtime::WuiValue,
    robots: Vec<TableRowModel>,
    config: Vec<StatusLineModel>,
    health: Vec<StatusLineModel>,
    events: Vec<LogLineModel>,
}

pub(crate) struct RobotsController;

#[wgui_controller(template = "robots_controller")]
impl RobotsController {
    pub(crate) fn new() -> Self {
        Self
    }

    pub(crate) fn state(&self) -> RobotsModel {
        RobotsModel {
            shell: shell("robots", simple_trail("Fleet", "PuppyBot-X1", "")),
            panel_entry: PANEL_CONTROLLER_ENTRY.to_string(),
            robot_props: panel_props("robot"),
            map_props: panel_props("fleet_map"),
            robots: vec![
                table_row(
                    "PuppyBot-X1",
                    "Warehouse A-1",
                    "Pallet Pickup A -> B",
                    "78%",
                    "ACTIVE",
                    "#36d67a",
                ),
                table_row(
                    "PuppyBot-X2",
                    "Warehouse A-2",
                    "Inventory Scan Zone 3",
                    "62%",
                    "ACTIVE",
                    "#36d67a",
                ),
                table_row(
                    "PuppyBot-X3",
                    "Charging Station",
                    "-",
                    "91%",
                    "IDLE",
                    "#7f8b9b",
                ),
                table_row(
                    "PuppyBot-X4",
                    "Warehouse B-1",
                    "Stock Inspection",
                    "55%",
                    "ACTIVE",
                    "#36d67a",
                ),
                table_row(
                    "Rover-R1",
                    "Warehouse A-3",
                    "Patrol Route Alpha",
                    "83%",
                    "ACTIVE",
                    "#36d67a",
                ),
                table_row("Rover-R2", "Maintenance Bay", "-", "67%", "IDLE", "#7f8b9b"),
            ],
            config: vec![
                status_line("Robot Model", "PuppyBot-X1", "", "#dce7f3"),
                status_line("Serial Number", "PBX1-0007", "", "#dce7f3"),
                status_line("Hardware Rev", "A2", "", "#dce7f3"),
                status_line("Compute Unit", "NVIDIA Orin NX", "", "#dce7f3"),
                status_line("Software Version", "v2.4.1", "Up to date", "#36d67a"),
            ],
            health: vec![
                status_line("Overall Health", "Good", "", "#36d67a"),
                status_line("Battery", "78%", "", "#36d67a"),
                status_line("Temperature", "42 C", "", "#36d67a"),
                status_line("Motors", "OK", "", "#36d67a"),
                status_line("Network", "OK", "", "#36d67a"),
            ],
            events: vec![
                log_line(
                    "May 16, 10:15:43 AM",
                    "INFO",
                    "Mission progress: Picked up pallet at Zone A-1",
                    "#5da2ff",
                ),
                log_line(
                    "May 16, 10:13:22 AM",
                    "INFO",
                    "Navigated to waypoint A-1-7",
                    "#5da2ff",
                ),
                log_line(
                    "May 16, 10:11:05 AM",
                    "WARN",
                    "Obstacle detected and avoided",
                    "#ffbb3c",
                ),
            ],
        }
    }
}
