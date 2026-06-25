use wgui::{WguiModel, wgui_controller};

use crate::shared::*;

#[derive(Debug, Clone, WguiModel)]
pub(crate) struct ReplayModel {
    shell: ShellModel,
    panel_entry: String,
    video_props: wgui::wui::runtime::WuiValue,
    map_props: wgui::wui::runtime::WuiValue,
    timeline_props: wgui::wui::runtime::WuiValue,
    runs: Vec<TableRowModel>,
    details: Vec<StatusLineModel>,
    events: Vec<LogLineModel>,
}

pub(crate) struct ReplayController;

#[wgui_controller(template = "replay_controller")]
impl ReplayController {
    pub(crate) fn new() -> Self {
        Self
    }

    pub(crate) fn state(&self) -> ReplayModel {
        ReplayModel {
            shell: shell(
                "replay",
                simple_trail("Replays", "run_2025-05-16_0013", "REAL"),
            ),
            panel_entry: PANEL_CONTROLLER_ENTRY.to_string(),
            video_props: panel_props("replay_video"),
            map_props: panel_props("replay_map"),
            timeline_props: panel_props("replay_timeline"),
            runs: vec![
                table_row(
                    "run_2025-05-16_0013",
                    "May 16, 10:15:34 AM",
                    "14m 26s",
                    "REAL",
                    "",
                    "#36d67a",
                ),
                table_row(
                    "run_2025-05-16_0012",
                    "May 16, 09:37:21 AM",
                    "8m 43s",
                    "REAL",
                    "",
                    "#36d67a",
                ),
                table_row(
                    "run_2025-05-16_0011",
                    "May 16, 08:51:08 AM",
                    "12m 09s",
                    "REAL",
                    "",
                    "#36d67a",
                ),
                table_row(
                    "run_2025-05-15_0028",
                    "May 15, 04:22:11 PM",
                    "9m 16s",
                    "REAL",
                    "",
                    "#36d67a",
                ),
                table_row(
                    "run_2025-05-15_0027",
                    "May 15, 03:11:44 PM",
                    "6m 02s",
                    "SIM",
                    "",
                    "#b76cff",
                ),
            ],
            details: vec![
                status_line("Run ID", "run_2025-05-16_0013", "", "#dce7f3"),
                status_line("Status", "Completed", "", "#36d67a"),
                status_line("Duration", "14m 26s", "", "#dce7f3"),
                status_line("Distance", "612.4 m", "", "#dce7f3"),
                status_line("Robot", "PuppyBot-X1", "", "#dce7f3"),
                status_line("Operator", "A. Engineer", "", "#dce7f3"),
            ],
            events: vec![
                log_line("10:15:34 AM", "INFO", "Run started", "#36d67a"),
                log_line("10:16:02 AM", "INFO", "Waypoint 1 reached", "#5da2ff"),
                log_line("10:17:48 AM", "INFO", "Box pickup detected", "#b76cff"),
                log_line("10:20:11 AM", "WARN", "Obstacle detected", "#ff4d4d"),
                log_line("10:31:05 AM", "INFO", "Run completed", "#36d67a"),
            ],
        }
    }
}
