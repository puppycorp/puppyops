use wgui::WguiModel;
use wgui::wui::runtime::WuiValue;

pub(crate) const PANEL_CONTROLLER_ENTRY: &str =
    "/fs/wgui-controllers/puppyops-panel/controller.js?v=puppyops-v7";

#[derive(Debug, Clone, WguiModel)]
pub(crate) struct NavItemModel {
    pub(crate) label: String,
    pub(crate) href: String,
    pub(crate) active: bool,
}

#[derive(Debug, Clone, WguiModel)]
pub(crate) struct BreadcrumbItemModel {
    pub(crate) label: String,
    pub(crate) active: bool,
    pub(crate) badge: String,
    pub(crate) has_badge: bool,
    pub(crate) separator: String,
    pub(crate) has_separator: bool,
}

#[derive(Debug, Clone, WguiModel)]
pub(crate) struct ShellModel {
    pub(crate) nav_items: Vec<NavItemModel>,
    pub(crate) breadcrumbs: Vec<BreadcrumbItemModel>,
}

#[derive(Debug, Clone, WguiModel)]
pub(crate) struct StatusLineModel {
    pub(crate) label: String,
    pub(crate) value: String,
    pub(crate) detail: String,
    pub(crate) accent: String,
}

#[derive(Debug, Clone, WguiModel)]
pub(crate) struct LogLineModel {
    pub(crate) time: String,
    pub(crate) level: String,
    pub(crate) message: String,
    pub(crate) color: String,
}

#[derive(Debug, Clone, WguiModel)]
pub(crate) struct StatCardModel {
    pub(crate) label: String,
    pub(crate) value: String,
    pub(crate) detail: String,
    pub(crate) accent: String,
}

#[derive(Debug, Clone, WguiModel)]
pub(crate) struct TableRowModel {
    pub(crate) name: String,
    pub(crate) col1: String,
    pub(crate) col2: String,
    pub(crate) col3: String,
    pub(crate) badge: String,
    pub(crate) accent: String,
}

pub(crate) fn json_to_wui(value: &serde_json::Value) -> WuiValue {
    match value {
        serde_json::Value::Null => WuiValue::Null,
        serde_json::Value::Bool(value) => WuiValue::Bool(*value),
        serde_json::Value::Number(value) => WuiValue::Number(value.as_f64().unwrap_or(0.0)),
        serde_json::Value::String(value) => WuiValue::String(value.clone()),
        serde_json::Value::Array(values) => {
            WuiValue::List(values.iter().map(json_to_wui).collect())
        }
        serde_json::Value::Object(values) => WuiValue::Object(
            values
                .iter()
                .map(|(key, value)| (key.clone(), json_to_wui(value)))
                .collect(),
        ),
    }
}

pub(crate) fn panel_props(mode: &str) -> WuiValue {
    json_to_wui(&serde_json::json!({ "mode": mode }))
}

pub(crate) fn nav_item(label: &str, href: &str, active: &str) -> NavItemModel {
    NavItemModel {
        label: label.to_string(),
        href: href.to_string(),
        active: href.trim_start_matches('/') == active,
    }
}

pub(crate) fn breadcrumb(
    label: &str,
    active: bool,
    badge: &str,
    separator: &str,
) -> BreadcrumbItemModel {
    BreadcrumbItemModel {
        label: label.to_string(),
        active,
        badge: badge.to_string(),
        has_badge: !badge.is_empty(),
        separator: separator.to_string(),
        has_separator: !separator.is_empty(),
    }
}

pub(crate) fn shell(active: &str, trail: Vec<BreadcrumbItemModel>) -> ShellModel {
    ShellModel {
        nav_items: vec![
            nav_item("Teleop", "/teleop", active),
            nav_item("Missions", "/missions", active),
            nav_item("Datasets", "/datasets", active),
            nav_item("Replay", "/replay", active),
            nav_item("Diagnostics", "/diagnostics", active),
            nav_item("Robots", "/robots", active),
            nav_item("Config", "/config", active),
        ],
        breadcrumbs: trail,
    }
}

pub(crate) fn robot_trail(active: &str) -> Vec<BreadcrumbItemModel> {
    vec![
        breadcrumb("Projects", false, "", "/"),
        breadcrumb("Atlas Warehouse Demo", false, "", "/"),
        breadcrumb("Robots", false, "", "/"),
        breadcrumb("PuppyBot-X1", false, "REAL", "/"),
        breadcrumb(active, true, "", ""),
    ]
}

pub(crate) fn simple_trail(section: &str, leaf: &str, badge: &str) -> Vec<BreadcrumbItemModel> {
    vec![
        breadcrumb("Projects", false, "", "/"),
        breadcrumb("Atlas Warehouse Demo", false, "", "/"),
        breadcrumb(section, false, "", "/"),
        breadcrumb(leaf, true, badge, ""),
    ]
}

pub(crate) fn status_line(label: &str, value: &str, detail: &str, accent: &str) -> StatusLineModel {
    StatusLineModel {
        label: label.to_string(),
        value: value.to_string(),
        detail: detail.to_string(),
        accent: accent.to_string(),
    }
}

pub(crate) fn log_line(time: &str, level: &str, message: &str, color: &str) -> LogLineModel {
    LogLineModel {
        time: time.to_string(),
        level: level.to_string(),
        message: message.to_string(),
        color: color.to_string(),
    }
}

pub(crate) fn stat_card(label: &str, value: &str, detail: &str, accent: &str) -> StatCardModel {
    StatCardModel {
        label: label.to_string(),
        value: value.to_string(),
        detail: detail.to_string(),
        accent: accent.to_string(),
    }
}

pub(crate) fn table_row(
    name: &str,
    col1: &str,
    col2: &str,
    col3: &str,
    badge: &str,
    accent: &str,
) -> TableRowModel {
    TableRowModel {
        name: name.to_string(),
        col1: col1.to_string(),
        col2: col2.to_string(),
        col3: col3.to_string(),
        badge: badge.to_string(),
        accent: accent.to_string(),
    }
}

pub(crate) fn default_logs() -> Vec<LogLineModel> {
    vec![
        log_line(
            "10:44:12",
            "INFO",
            "Inspect step started at location B2-04",
            "#36d67a",
        ),
        log_line(
            "10:43:58",
            "INFO",
            "Arrived at place location B2-04",
            "#36d67a",
        ),
        log_line("10:43:31", "INFO", "Pallet placed successfully", "#36d67a"),
        log_line(
            "10:43:05",
            "INFO",
            "Navigating to place location B2-04",
            "#36d67a",
        ),
        log_line(
            "10:42:41",
            "WARN",
            "Path adjusted to avoid obstacle in aisle",
            "#ffbb3c",
        ),
        log_line(
            "10:42:15",
            "INFO",
            "Arrived at pick location A1-12",
            "#36d67a",
        ),
    ]
}
