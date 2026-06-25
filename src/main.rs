mod config_controller;
mod datasets_controller;
mod diagnostics_controller;
mod missions_controller;
mod replay_controller;
mod robots_controller;
mod shared;
mod teleop_controller;

use std::net::{IpAddr, SocketAddr};

use config_controller::ConfigController;
use datasets_controller::DatasetsController;
use diagnostics_controller::DiagnosticsController;
use log::LevelFilter;
use missions_controller::MissionsController;
use replay_controller::ReplayController;
use robots_controller::RobotsController;
use teleop_controller::TeleopController;
use wgui::Wgui;

const PUPPYOPS_CSS: &str = include_str!("../wui/puppyops.css");

fn ui_url(bind_addr: SocketAddr) -> String {
    let host = match bind_addr.ip() {
        IpAddr::V4(ip) if ip.is_unspecified() => "127.0.0.1".to_string(),
        IpAddr::V6(ip) if ip.is_unspecified() => "::1".to_string(),
        _ => bind_addr.ip().to_string(),
    };

    if host.contains(':') {
        format!("http://[{host}]:{}", bind_addr.port())
    } else {
        format!("http://{host}:{}", bind_addr.port())
    }
}

fn bind_arg() -> Result<SocketAddr, Box<dyn std::error::Error>> {
    let mut args = std::env::args().skip(1);
    let mut bind = "0.0.0.0:9052".to_string();

    while let Some(arg) = args.next() {
        if arg == "--bind" {
            bind = args
                .next()
                .ok_or_else(|| "--bind requires host:port".to_string())?;
        }
    }

    bind.parse::<SocketAddr>()
        .map_err(|err| format!("invalid --bind value '{}': {}", bind, err).into())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    simple_logger::SimpleLogger::new()
        .with_level(LevelFilter::Info)
        .without_timestamps()
        .init()
        .ok();

    let bind_addr = bind_arg()?;
    println!("PuppyOps listening on {}", ui_url(bind_addr));
    println!("Press Ctrl-C to stop.");

    let mut wgui = Wgui::new(bind_addr);
    wgui.set_css(PUPPYOPS_CSS);
    wgui.add_page_with("/", || async { TeleopController::new() });
    wgui.add_page_with("/teleop", || async { TeleopController::new() });
    wgui.add_page_with("/missions", || async { MissionsController::new() });
    wgui.add_page_with("/datasets", || async { DatasetsController::new() });
    wgui.add_page_with("/replay", || async { ReplayController::new() });
    wgui.add_page_with("/diagnostics", || async { DiagnosticsController::new() });
    wgui.add_page_with("/robots", || async { RobotsController::new() });
    wgui.add_page_with("/config", || async { ConfigController::new() });
    wgui.run().await;

    Ok(())
}
