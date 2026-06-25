use wgui::{WguiModel, wgui_controller};

use crate::shared::*;

#[derive(Debug, Clone, WguiModel)]
pub(crate) struct MissionsModel {
    shell: ShellModel,
    panel_entry: String,
    mission_map_props: wgui::wui::runtime::WuiValue,
    preview_props: wgui::wui::runtime::WuiValue,
    robot_props: wgui::wui::runtime::WuiValue,
    queue: Vec<TableRowModel>,
    checks: Vec<StatusLineModel>,
    palette: Vec<StatusLineModel>,
    logs: Vec<LogLineModel>,
    schedule: Vec<TableRowModel>,
    stats: Vec<StatCardModel>,
}

pub(crate) struct MissionsController;

#[wgui_controller(template = "missions_controller")]
impl MissionsController {
    pub(crate) fn new() -> Self {
        Self
    }

    pub(crate) fn state(&self) -> MissionsModel {
        MissionsModel {
            shell: shell(
                "missions",
                simple_trail("Missions", "Pallet Pickup A -> B", ""),
            ),
            panel_entry: PANEL_CONTROLLER_ENTRY.to_string(),
            mission_map_props: panel_props("mission_map"),
            preview_props: panel_props("front_rgb"),
            robot_props: panel_props("robot"),
            queue: vec![
                table_row(
                    "Pallet Pickup A -> B",
                    "PuppyBot-01",
                    "52%",
                    "ETA 10:45 AM",
                    "ACTIVE",
                    "#36d67a",
                ),
                table_row(
                    "Inventory Scan Zone 3",
                    "PuppyBot-02",
                    "Queued",
                    "11:15 AM",
                    "QUEUED",
                    "#7f8b9b",
                ),
                table_row(
                    "Dock Inspection Route",
                    "PuppyBot-01",
                    "Queued",
                    "12:00 PM",
                    "QUEUED",
                    "#7f8b9b",
                ),
            ],
            checks: vec![
                status_line("E-Stop Circuit", "OK", "", "#36d67a"),
                status_line("Battery Level", "78%", "", "#36d67a"),
                status_line("Path Clearance", "OK", "", "#36d67a"),
                status_line("Payload Check", "OK", "", "#36d67a"),
                status_line("Robot Health", "OK", "", "#36d67a"),
            ],
            palette: vec![
                status_line("Navigate", "1", "", "#36d67a"),
                status_line("Pick", "2", "", "#ffcf30"),
                status_line("Place", "3", "", "#4d9dff"),
                status_line("Inspect", "4", "", "#b76cff"),
                status_line("Dock", "5", "", "#ff8b22"),
            ],
            logs: default_logs(),
            schedule: vec![
                table_row(
                    "10:32 AM",
                    "Pallet Pickup A -> B",
                    "PuppyBot-01",
                    "In Progress",
                    "",
                    "#36d67a",
                ),
                table_row(
                    "11:15 AM",
                    "Inventory Scan Zone 3",
                    "PuppyBot-02",
                    "Queued",
                    "",
                    "#5da2ff",
                ),
                table_row(
                    "12:00 PM",
                    "Dock Inspection Route",
                    "PuppyBot-01",
                    "Queued",
                    "",
                    "#5da2ff",
                ),
                table_row(
                    "01:00 PM",
                    "Restock Shelf 7B",
                    "PuppyBot-03",
                    "Queued",
                    "",
                    "#5da2ff",
                ),
            ],
            stats: vec![
                stat_card("Missions Completed", "24", "+26% vs prev 7 days", "#36d67a"),
                stat_card("Success Rate", "96.2%", "+3.4% vs prev 7 days", "#36d67a"),
                stat_card(
                    "Avg. Duration",
                    "12m 48s",
                    "-1m 12s vs prev 7 days",
                    "#36d67a",
                ),
                stat_card(
                    "Distance Traveled",
                    "18.7 km",
                    "+2.3 km vs prev 7 days",
                    "#36d67a",
                ),
            ],
        }
    }
}
