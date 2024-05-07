import { useEffect, useRef, useMemo } from "react";

import styles from "./home.module.scss";

import { IconButton } from "./button";
import SettingsIcon from "../icons/settings.svg";
import GithubIcon from "../icons/github.svg";
import ChatGptIcon from "../icons/chatgpt.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import DeleteIcon from "../icons/delete.svg";
import MaskIcon from "../icons/mask.svg";
import PluginIcon from "../icons/plugin.svg";
import DragIcon from "../icons/drag.svg";
import BlogIcon from "../icons/blog.svg";

import Locale from "../locales";

import { useAppConfig, useChatStore } from "../store";

import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
  REPO_URL, BLOG_URL
} from "../constant";

import { Link, useNavigate } from "react-router-dom";
import { isIOS, useMobileScreen } from "../utils";
import dynamic from "next/dynamic";
import { showConfirm, showToast } from "./ui-lib";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});

function useHotKey() {
  const chatStore = useChatStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey) {
        if (e.key === "ArrowUp") {
          chatStore.nextSession(-1);
        } else if (e.key === "ArrowDown") {
          chatStore.nextSession(1);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}

function useDragSideBar() {
  const limit = (x: number) => Math.min(MAX_SIDEBAR_WIDTH, x);

  const config = useAppConfig();
  const startX = useRef(0);
  const startDragWidth = useRef(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
  const lastUpdateTime = useRef(Date.now());

  const toggleSideBar = () => {
    config.update((config) => {
      if (config.sidebarWidth < MIN_SIDEBAR_WIDTH) {
        config.sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
      } else {
        config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
      }
    });
  };

  const onDragStart = (e: MouseEvent) => {
    // Remembers the initial width each time the mouse is pressed
    startX.current = e.clientX;
    startDragWidth.current = config.sidebarWidth;
    const dragStartTime = Date.now();

    const handleDragMove = (e: MouseEvent) => {
      if (Date.now() < lastUpdateTime.current + 20) {
        return;
      }
      lastUpdateTime.current = Date.now();
      const d = e.clientX - startX.current;
      const nextWidth = limit(startDragWidth.current + d);
      config.update((config) => {
        if (nextWidth < MIN_SIDEBAR_WIDTH) {
          config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
        } else {
          config.sidebarWidth = nextWidth;
        }
      });
    };

    const handleDragEnd = () => {
      // In useRef the data is non-responsive, so `config.sidebarWidth` can't get the dynamic sidebarWidth
      window.removeEventListener("pointermove", handleDragMove);
      window.removeEventListener("pointerup", handleDragEnd);

      // if user click the drag icon, should toggle the sidebar
      const shouldFireClick = Date.now() - dragStartTime < 300;
      if (shouldFireClick) {
        toggleSideBar();
      }
    };

    window.addEventListener("pointermove", handleDragMove);
    window.addEventListener("pointerup", handleDragEnd);
  };

  const isMobileScreen = useMobileScreen();
  const shouldNarrow =
    !isMobileScreen && config.sidebarWidth < MIN_SIDEBAR_WIDTH;

  useEffect(() => {
    const barWidth = shouldNarrow
      ? NARROW_SIDEBAR_WIDTH
      : limit(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
    const sideBarWidth = isMobileScreen ? "100vw" : `${barWidth}px`;
    document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
  }, [config.sidebarWidth, isMobileScreen, shouldNarrow]);

  return {
    onDragStart,
    shouldNarrow,
  };
}

export function SideBar(props: { className?: string }) {
  const chatStore = useChatStore();

  // drag side bar
  const { onDragStart, shouldNarrow } = useDragSideBar();
  const navigate = useNavigate();
  const config = useAppConfig();
  const isMobileScreen = useMobileScreen();
  const isIOSMobile = useMemo(
    () => isIOS() && isMobileScreen,
    [isMobileScreen],
  );

  useHotKey();

  return (
    <div
      className={`${styles.sidebar} ${props.className} ${
        shouldNarrow && styles["narrow-sidebar"]
      }`}
      style={{
        // #3016 disable transition on ios mobile screen
        transition: isMobileScreen && isIOSMobile ? "none" : undefined,
      }}
    >
      <div className={styles["sidebar-header"]} data-tauri-drag-region>
        <div className={styles["sidebar-title"]} data-tauri-drag-region>
          Let&apos;s Chat
        </div>
        <div className={styles["sidebar-sub-title"]}>
          在看不见的未来，一起拭目以待。
        </div>
        <div className={styles["sidebar-logo"] + " no-dark"}>
          <ChatGptIcon />
        </div>
      </div>

      <div className={styles["sidebar-header-bar"]}>
        <IconButton
          icon={<MaskIcon />}
          text={shouldNarrow ? undefined : Locale.Mask.Name}
          className={styles["sidebar-bar-button"]}
          onClick={() => {
            if (config.dontShowMaskSplashScreen !== true) {
              navigate(Path.NewChat, { state: { fromHome: true } });
            } else {
              navigate(Path.Masks, { state: { fromHome: true } });
            }
          }}
          shadow
        />
        <IconButton
          icon={<PluginIcon />}
          text={shouldNarrow ? undefined : Locale.Plugin.Name}
          className={styles["sidebar-bar-button"]}
          onClick={() => showToast(Locale.WIP)}
          shadow
        />
      </div>

      <div
        className={styles["sidebar-body"]}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            navigate(Path.Home);
          }
        }}
      >
        <ChatList narrow={shouldNarrow} />
      </div>

      <div className={styles["sidebar-tail"]}>
        <div className={styles["sidebar-actions"]}>
          <div className={styles["sidebar-action"] + " " + styles.mobile}>
            <IconButton
              icon={<DeleteIcon />}
              onClick={async () => {
                if (await showConfirm(Locale.Home.DeleteChat)) {
                  chatStore.deleteSession(chatStore.currentSessionIndex);
                }
              }}
            />
          </div>
          <div className={styles["sidebar-action"]}>
            <Link to={Path.Settings}>
              <IconButton icon={<SettingsIcon />} shadow />
            </Link>
          </div>
          <div className={styles["sidebar-action"]}>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              <IconButton icon={<GithubIcon />} shadow />
            </a>
          </div>
          <div className={styles["sidebar-action"]}>
            <a href={BLOG_URL} target="_blank" rel="noopener noreferrer">
              <svg t="1715050281371" className="icon" viewBox="0 0 1024 1024" version="1.1"
                   xmlns="http://www.w3.org/2000/svg" p-id="3650" width="200" height="200">
                <path
                    d="M260.812609 594.761935c20.509103-17.712407 30.763654-40.86164 30.763654-69.450768 0-22.992667-6.758937-41.677215-20.275789-56.04955-13.516852-14.369266-31.54239-22.874987-54.06843-25.51921l0-0.932232c18.021445-5.903453 32.161491-15.847943 42.416042-29.830399 10.254551-13.983479 15.382339-30.450523 15.382339-49.408293 0-22.682605-8.469905-41.09393-25.403576-55.233975-16.936741-14.135952-39.85266-21.208021-68.750827-21.208021L85.788363 287.129486l0 334.200548 97.416703 0C214.434326 621.330034 240.303506 612.474342 260.812609 594.761935zM124.941082 322.553277l44.980447 0c42.72508 0 64.089667 16.237823 64.089667 48.708352 0 18.801205-6.139837 33.366945-18.411325 43.698245-12.275581 10.334369-29.131481 15.498996-50.572816 15.498996l-40.085974 0L124.941082 322.553277zM124.941082 465.649346l44.980447 0c53.755298 0 80.636528 19.733437 80.636528 59.196217 0 18.956747-6.332219 33.873482-18.99461 44.747133-12.664438 10.876722-30.493501 16.313547-53.486168 16.313547l-53.136198 0L124.941082 465.649346zM354.268094 286.438755l38.220487 0 0 334.89128-38.220487 0 0-334.89128ZM656.189472 587.43097c21.518083-22.915919 32.278147-53.405327 32.278147-91.474364 0-38.839587-9.984399-69.217455-29.947056-91.124394-19.966751-21.906939-47.740304-32.860409-83.317591-32.860409-37.288255 0-66.886363 11.266601-88.793302 33.792641-21.906939 22.530133-32.860409 53.835116-32.860409 93.92109 0 36.82265 10.523681 66.384943 31.578206 88.677669 21.051455 22.296819 49.211818 33.443693 84.483136 33.443693C605.810061 621.806895 634.669342 610.349959 656.189472 587.43097zM492.70198 498.287697c0-29.364795 7.143701-52.397371 21.440311-69.100798 14.293541-16.700357 33.712823-25.053606 58.263985-25.053606 24.704658 0 43.698245 8.080026 56.982806 24.238031 13.283538 16.161075 19.926842 39.152718 19.926842 68.984141 0 29.521361-6.642281 52.283784-19.926842 68.285223-13.283538 16.004509-32.278147 24.004717-56.982806 24.004717-24.238031 0-43.580564-8.157797-58.030671-24.471344C499.926522 548.861536 492.70198 526.566764 492.70198 498.287697zM953.218422 597.10326 953.218422 377.565195l-38.22151 0 0 33.093722-0.931209 0c-15.538905-25.789363-39.386032-38.687114-71.548546-38.687114-33.873482 0-60.558238 11.965519-80.053244 35.890418-19.501146 23.927969-29.249161 56.166207-29.249161 96.717785 0 35.737946 9.05012 64.206324 27.151383 85.415368 18.098193 21.208021 41.98523 31.81152 71.66418 31.81152 36.509519 0 63.856353-15.22475 82.035388-45.679365l0.931209 0 0 26.102495c0 24.480554-4.532223 44.140313-13.553691 59.026348l-19.323091 20.441565c-0.276293 0.187265-0.546446 0.379647-0.825808 0.562818-6.04467 3.734044-48.823985 27.699875-110.058628-0.473791-66.173119-30.446429-160.317289-32.940227-183.51257 46.759977l27.288506 21.030989c0 0 0-37.520545 42.296315-52.529377 31.41857-11.148921 65.62258 2.943029 92.685959 14.557554l0 0.160659c7.767917 3.939729 16.008602 7.169283 24.701588 9.721409 0.143263 0.046049 0.288572 0.094144 0.430812 0.13917 1.215688 0.381693 2.52552 0.73678 3.90903 1.066285 14.81645 3.891633 30.921243 5.854335 48.331775 5.854335C911.269008 728.545918 953.218422 684.73204 953.218422 597.10326zM894.83778 566.806233c-13.440104 15.228843-30.879288 22.839171-52.320623 22.839171-21.131273 0-38.10383-7.960299-50.922786-23.889083-12.81691-15.924691-19.2269-37.171598-19.2269-63.74072 0-30.916127 6.678096-54.960753 20.042475-72.129784 13.361309-17.165961 31.848359-25.752524 55.467289-25.752524 19.111267 0 35.074843 6.757914 47.892777 20.275789 12.817933 13.516852 19.2269 29.754674 19.2269 48.708352l0 35.1915C914.996912 532.080338 908.275837 551.581484 894.83778 566.806233z"
                    fill="#272636" p-id="3651"></path>
              </svg>
            </a>
          </div>
        </div>
        <div>
          <IconButton
              icon={<AddIcon/>}
              text={shouldNarrow ? undefined : Locale.Home.NewChat}
              onClick={() => {
                if (config.dontShowMaskSplashScreen) {
                  chatStore.newSession();
                  navigate(Path.Chat);
                } else {
                  navigate(Path.NewChat);
                }
              }}
              shadow
          />
        </div>
      </div>

      <div
          className={styles["sidebar-drag"]}
          onPointerDown={(e) => onDragStart(e as any)}
      >
        <DragIcon/>
      </div>
    </div>
  );
}
