use wgui::{WguiModel, wgui_controller};

use crate::shared::*;

#[derive(Debug, Clone, WguiModel)]
pub(crate) struct DatasetsModel {
    shell: ShellModel,
    panel_entry: String,
    preview_props: wgui::wui::runtime::WuiValue,
    depth_props: wgui::wui::runtime::WuiValue,
    lidar_props: wgui::wui::runtime::WuiValue,
    hand_props: wgui::wui::runtime::WuiValue,
    stats: Vec<StatCardModel>,
    rows: Vec<TableRowModel>,
    metadata: Vec<StatusLineModel>,
    split: Vec<StatusLineModel>,
    tags: Vec<StatusLineModel>,
}

pub(crate) struct DatasetsController;

#[wgui_controller(template = "datasets_controller")]
impl DatasetsController {
    pub(crate) fn new() -> Self {
        Self
    }

    pub(crate) fn state(&self) -> DatasetsModel {
        DatasetsModel {
            shell: shell(
                "datasets",
                simple_trail("Datasets", "atlas_warehouse_v1.2", "REAL"),
            ),
            panel_entry: PANEL_CONTROLLER_ENTRY.to_string(),
            preview_props: panel_props("front_rgb"),
            depth_props: panel_props("depth"),
            lidar_props: panel_props("dataset_lidar"),
            hand_props: panel_props("right_hand"),
            stats: vec![
                stat_card(
                    "Total Samples",
                    "123,418",
                    "+8,642 (7.5%) vs v1.1",
                    "#36d67a",
                ),
                stat_card("Duration", "14h 26m", "+1h 32m vs v1.1", "#5da2ff"),
                stat_card("Data Size", "128.4 GB", "+12.8 GB vs v1.1", "#ffbb3c"),
                stat_card("Sequences", "96", "+8 vs v1.1", "#36d67a"),
                stat_card("Quality Score", "92 / 100", "Excellent", "#36d67a"),
                stat_card("Annotation Progress", "73%", "+6% vs v1.1", "#b76cff"),
            ],
            rows: vec![
                table_row(
                    "atlas_warehouse_v1.2",
                    "Multi-Modal",
                    "123,418",
                    "92",
                    "REAL",
                    "#36d67a",
                ),
                table_row(
                    "atlas_warehouse_v1.1",
                    "Multi-Modal",
                    "84,768",
                    "87",
                    "REAL",
                    "#36d67a",
                ),
                table_row(
                    "dock_inspection_run_1",
                    "Multi-Modal",
                    "96",
                    "78",
                    "SIM",
                    "#5da2ff",
                ),
                table_row(
                    "night_run_v1",
                    "Multi-Modal",
                    "64,168",
                    "88",
                    "REAL",
                    "#36d67a",
                ),
                table_row(
                    "pallet_pickup_v2",
                    "Multi-Modal",
                    "94,168",
                    "91",
                    "REAL",
                    "#36d67a",
                ),
                table_row(
                    "warehouse_survey_v1",
                    "Multi-Modal",
                    "231,663",
                    "90",
                    "REAL",
                    "#36d67a",
                ),
            ],
            metadata: vec![
                status_line("Dataset ID", "ds_01JZXY96...", "", "#8eb6d8"),
                status_line("Source", "REAL", "", "#36d67a"),
                status_line("Capture Robot", "PuppyBot-X1", "", "#dce7f3"),
                status_line("Location", "Atlas Warehouse Bay 1", "", "#dce7f3"),
                status_line("Version", "1.2", "", "#dce7f3"),
            ],
            split: vec![
                status_line("Train", "73%", "90,894", "#4d9dff"),
                status_line("Val", "15%", "18,745", "#36d67a"),
                status_line("Test", "12%", "13,779", "#b76cff"),
            ],
            tags: [
                "box", "pallet", "shelf", "forklift", "tote", "barrel", "cone", "cart", "person",
                "door",
            ]
            .iter()
            .map(|tag| status_line(tag, "", "", "#8eb6d8"))
            .collect(),
        }
    }
}
