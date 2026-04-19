import type { EntryType } from "@prisma/client";

import type { EntryView } from "@/lib/entry-views";

export const localeCookieName = "omnidrop_locale";

export const supportedLocales = ["zh-CN", "en", "ja", "fr", "de", "es"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export const localeOptions: Array<{ code: AppLocale; label: string }> = [
  { code: "zh-CN", label: "简体中文" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" }
];

export type MessageKey =
  | "header.collections"
  | "header.settings"
  | "header.language"
  | "header.duplicates"
  | "toolbar.stream"
  | "toolbar.count"
  | "toolbar.clear"
  | "toolbar.search"
  | "toolbar.collapse"
  | "toolbar.search_placeholder"
  | "toolbar.only_duplicates"
  | "toolbar.clear_filters"
  | "toolbar.saved_views"
  | "toolbar.save_view"
  | "toolbar.save_view_placeholder"
  | "toolbar.save_view_confirm"
  | "toolbar.save_view_cancel"
  | "toolbar.delete_view"
  | "toolbar.confirm_delete_view"
  | "toolbar.save_view_name_required"
  | "toolbar.save_view_failed"
  | "toolbar.delete_view_failed"
  | "toolbar.organize"
  | "toolbar.selection_count"
  | "toolbar.select_all_visible"
  | "toolbar.clear_selection"
  | "toolbar.exit_selection"
  | "toolbar.long_press_hint"
  | "toolbar.all_tags"
  | "empty.title"
  | "empty.description"
  | "composer.empty_error"
  | "composer.new_content"
  | "composer.pending_count"
  | "composer.ready_to_send"
  | "composer.instructions"
  | "composer.text_and_files"
  | "composer.shortcut"
  | "composer.placeholder"
  | "composer.pending_file"
  | "composer.remove"
  | "composer.add_files"
  | "composer.clear_files"
  | "composer.sending"
  | "composer.send"
  | "composer.send_count"
  | "composer.open"
  | "composer.cta_title"
  | "composer.cta_description"
  | "entry.local_source"
  | "entry.favorite"
  | "entry.archived"
  | "entry.pinned"
  | "entry.duplicate"
  | "entry.note"
  | "entry.share_revoked"
  | "entry.open"
  | "entry.download"
  | "entry.open_new_window"
  | "search.matches"
  | "search.source_message"
  | "search.source_note"
  | "search.source_asset_name"
  | "search.source_asset_text"
  | "search.source_sender"
  | "actions.processing"
  | "actions.copy_share"
  | "actions.copy_text"
  | "actions.copy_image"
  | "actions.more"
  | "actions.generate_share"
  | "actions.revoke_share"
  | "actions.revoking"
  | "actions.delete"
  | "actions.deleting"
  | "actions.confirm_delete"
  | "actions.share_copied"
  | "actions.share_generated"
  | "actions.share_failed"
  | "actions.share_revoked"
  | "actions.revoke_failed"
  | "actions.deleted"
  | "actions.delete_failed"
  | "actions.copy_prompt"
  | "actions.copy_failed"
  | "actions.copy_preferred_share"
  | "actions.copy_public_share"
  | "actions.copy_internal_share"
  | "actions.text_copied"
  | "actions.image_copied"
  | "actions.favorite"
  | "actions.unfavorite"
  | "actions.pin"
  | "actions.unpin"
  | "actions.archive"
  | "actions.unarchive"
  | "actions.cleanup_duplicates"
  | "actions.favorite_added"
  | "actions.favorite_removed"
  | "actions.favorite_failed"
  | "actions.pinned"
  | "actions.unpinned"
  | "actions.pin_failed"
  | "actions.archived"
  | "actions.unarchived"
  | "actions.archive_failed"
  | "actions.cleanup_duplicates_done"
  | "actions.cleanup_duplicates_empty"
  | "actions.cleanup_duplicates_failed"
  | "actions.confirm_cleanup_duplicates"
  | "actions.preferred_share_copied"
  | "actions.public_share_copied"
  | "actions.internal_share_copied"
  | "actions.public_share_unavailable"
  | "actions.internal_share_unavailable"
  | "actions.select_item"
  | "actions.deselect_item"
  | "actions.batch_empty"
  | "actions.batch_failed"
  | "actions.confirm_batch_delete"
  | "actions.batch_pinned"
  | "actions.batch_unpinned"
  | "actions.batch_favorited"
  | "actions.batch_unfavorited"
  | "actions.batch_archived"
  | "actions.batch_unarchived"
  | "actions.batch_deleted"
  | "actions.batch_add_to_collection"
  | "actions.edit_note"
  | "actions.note_placeholder"
  | "actions.save_note"
  | "actions.clear_note"
  | "actions.note_saved"
  | "actions.note_cleared"
  | "actions.note_failed"
  | "actions.batch_add_tags"
  | "actions.batch_tags_added"
  | "actions.edit_tags"
  | "actions.tags_placeholder"
  | "actions.save_tags"
  | "actions.clear_tags"
  | "actions.tags_saved"
  | "actions.tags_cleared"
  | "actions.tags_failed"
  | "actions.tags_empty"
  | "actions.tags_required"
  | "settings.eyebrow"
  | "settings.title"
  | "settings.subtitle"
  | "settings.form_title"
  | "settings.form_description"
  | "settings.app_name"
  | "settings.share_base_url"
  | "settings.share_base_url_help"
  | "settings.public_share_base_url"
  | "settings.public_share_base_url_help"
  | "settings.internal_share_base_url"
  | "settings.internal_share_base_url_help"
  | "settings.storage_dir"
  | "settings.storage_dir_help"
  | "settings.save"
  | "settings.saving"
  | "settings.saved"
  | "share.title"
  | "share.description"
  | "share.collection_title"
  | "share.collection_description"
  | "not_found.title"
  | "not_found.description"
  | "not_found.back_home"
  | "collections.eyebrow"
  | "collections.title"
  | "collections.subtitle"
  | "collections.create_title"
  | "collections.create_description"
  | "collections.create"
  | "collections.create_with_selection"
  | "collections.edit"
  | "collections.updated"
  | "collections.existing"
  | "collections.title_placeholder"
  | "collections.description_placeholder"
  | "collections.title_required"
  | "collections.action_failed"
  | "collections.added"
  | "collections.created"
  | "collections.no_description"
  | "collections.shared"
  | "collections.entry_count"
  | "collections.empty_title"
  | "collections.empty_description"
  | "collections.empty_select_hint"
  | "collections.empty_items_title"
  | "collections.empty_items_description"
  | "collections.back_to_all"
  | "collections.move_up"
  | "collections.move_down"
  | "collections.remove_entry"
  | "collections.confirm_remove_entry"
  | "collections.confirm_delete"
  | "duplicates.eyebrow"
  | "duplicates.title"
  | "duplicates.subtitle"
  | "duplicates.filter_all"
  | "duplicates.filter_asset"
  | "duplicates.filter_url"
  | "duplicates.filter_text"
  | "duplicates.summary_groups"
  | "duplicates.summary_items"
  | "duplicates.empty_title"
  | "duplicates.empty_description"
  | "duplicates.recommended"
  | "duplicates.members"
  | "duplicates.keep_recommended"
  | "duplicates.keep_newest"
  | "duplicates.keep_oldest"
  | "duplicates.keep_this"
  | "duplicates.confirm_cleanup"
  | "duplicates.cleanup_done"
  | "duplicates.cleanup_empty"
  | "duplicates.cleanup_failed"
  | "duplicates.kind_asset"
  | "duplicates.kind_url"
  | "duplicates.kind_text"
  | "duplicates.reason_pinned"
  | "duplicates.reason_favorite"
  | "duplicates.reason_shared"
  | "duplicates.reason_active"
  | "duplicates.reason_newest"
  | "duplicates.latest"
  | "duplicates.oldest"
  | "duplicates.group_count"
  | "duplicates.member_assets"
  | "duplicates.reasons_label"
  | "duplicates.recommended_mark"
  | "duplicates.open_home";

type Messages = Partial<Record<MessageKey, string>>;

const messagesByLocale: Record<AppLocale, Messages> = {
  "zh-CN": {
    "header.collections": "合集",
    "header.settings": "设置",
    "header.language": "语言",
    "header.duplicates": "重复组",
    "toolbar.stream": "时间流",
    "toolbar.count": "{count} 条",
    "toolbar.clear": "清空",
    "toolbar.search": "搜索",
    "toolbar.collapse": "收起",
    "toolbar.search_placeholder": "搜内容、文件名、发送人或设备",
    "toolbar.only_duplicates": "仅重复项",
    "toolbar.clear_filters": "清空条件",
    "toolbar.saved_views": "已保存视图",
    "toolbar.save_view": "保存视图",
    "toolbar.save_view_placeholder": "给这个筛选起个名字",
    "toolbar.save_view_confirm": "保存",
    "toolbar.save_view_cancel": "取消",
    "toolbar.delete_view": "删除视图",
    "toolbar.confirm_delete_view": "确定删除这个保存视图吗？",
    "toolbar.save_view_name_required": "请先填写视图名称。",
    "toolbar.save_view_failed": "保存视图失败",
    "toolbar.delete_view_failed": "删除视图失败",
    "toolbar.organize": "批量整理",
    "toolbar.selection_count": "已选 {count} 条",
    "toolbar.select_all_visible": "全选当前结果",
    "toolbar.clear_selection": "清空选择",
    "toolbar.exit_selection": "退出整理",
    "toolbar.long_press_hint": "手机端长按内容也能直接进入多选。",
    "toolbar.all_tags": "全部标签",
    "empty.title": "这里会像聊天一样持续流动",
    "empty.description": "直接从底部发送文本、图片、视频、PDF 或任意文件，内容会立刻出现在时间线上。",
    "composer.empty_error": "请输入文本，或者添加至少一个文件。",
    "composer.new_content": "新内容",
    "composer.pending_count": "{count} 条待发送",
    "composer.ready_to_send": "准备发送",
    "composer.instructions": "文本会作为一整条消息发送，文件仍会逐条发送；拖拽、粘贴、选择都可以。",
    "composer.text_and_files": "文本和文件共用一个输入器",
    "composer.shortcut": "快捷键 Ctrl/Cmd + Enter",
    "composer.placeholder": "发一段文字，拖进来几张图，或者直接粘贴截图...",
    "composer.pending_file": "文件待发送",
    "composer.remove": "移除",
    "composer.add_files": "添加文件",
    "composer.clear_files": "清空附件",
    "composer.sending": "发送中...",
    "composer.send": "发送",
    "composer.send_count": "发送 {count} 条",
    "composer.open": "打开",
    "composer.cta_title": "发消息、传文件、贴截图",
    "composer.cta_description": "点击展开输入器，把新的内容丢进时间流",
    "entry.local_source": "本机来源",
    "entry.favorite": "已收藏",
    "entry.archived": "已归档",
    "entry.pinned": "已置顶",
    "entry.duplicate": "重复 {count} 条",
    "entry.note": "备注",
    "entry.share_revoked": "分享已撤销",
    "entry.open": "打开",
    "entry.download": "下载",
    "entry.open_new_window": "新窗口打开",
    "search.matches": "命中来源",
    "search.source_message": "正文",
    "search.source_note": "备注",
    "search.source_asset_name": "文件名",
    "search.source_asset_text": "文件内容",
    "search.source_sender": "发送来源",
    "actions.processing": "处理中...",
    "actions.copy_share": "复制分享链接",
    "actions.copy_text": "复制文本",
    "actions.copy_image": "复制图片",
    "actions.more": "更多操作",
    "actions.generate_share": "生成分享",
    "actions.revoke_share": "撤销分享",
    "actions.revoking": "撤销中...",
    "actions.delete": "删除",
    "actions.deleting": "删除中...",
    "actions.confirm_delete": "确定删除这条内容吗？文件也会一起删除。",
    "actions.share_copied": "分享链接已复制",
    "actions.share_generated": "分享链接已生成",
    "actions.share_failed": "分享失败",
    "actions.share_revoked": "分享已撤销",
    "actions.revoke_failed": "撤销失败",
    "actions.deleted": "内容已删除",
    "actions.delete_failed": "删除失败",
    "actions.copy_prompt": "复制下面的分享链接",
    "actions.copy_failed": "复制失败",
    "actions.copy_preferred_share": "复制推荐链接",
    "actions.copy_public_share": "公网链接",
    "actions.copy_internal_share": "内网链接",
    "actions.text_copied": "文本已复制",
    "actions.image_copied": "图片已复制",
    "actions.favorite": "加入收藏",
    "actions.unfavorite": "取消收藏",
    "actions.pin": "置顶",
    "actions.unpin": "取消置顶",
    "actions.archive": "归档",
    "actions.unarchive": "取消归档",
    "actions.cleanup_duplicates": "清理其他重复项",
    "actions.favorite_added": "已加入收藏",
    "actions.favorite_removed": "已取消收藏",
    "actions.favorite_failed": "收藏操作失败",
    "actions.pinned": "已置顶",
    "actions.unpinned": "已取消置顶",
    "actions.pin_failed": "置顶操作失败",
    "actions.archived": "已归档",
    "actions.unarchived": "已取消归档",
    "actions.archive_failed": "归档操作失败",
    "actions.cleanup_duplicates_done": "已清理 {count} 条重复项",
    "actions.cleanup_duplicates_empty": "没有其他重复项需要清理",
    "actions.cleanup_duplicates_failed": "清理重复项失败",
    "actions.confirm_cleanup_duplicates": "保留当前这条，并删除其他重复内容吗？",
    "actions.preferred_share_copied": "推荐链接已复制",
    "actions.public_share_copied": "公网链接已复制",
    "actions.internal_share_copied": "内网链接已复制",
    "actions.public_share_unavailable": "公网分享地址不可用",
    "actions.internal_share_unavailable": "内网分享地址不可用",
    "actions.select_item": "选择这条内容",
    "actions.deselect_item": "取消选择这条内容",
    "actions.batch_empty": "请先选择至少一条内容。",
    "actions.batch_failed": "批量操作失败",
    "actions.confirm_batch_delete": "确定删除选中的 {count} 条内容吗？文件也会一起删除。",
    "actions.batch_pinned": "已置顶 {count} 条内容",
    "actions.batch_unpinned": "已取消置顶 {count} 条内容",
    "actions.batch_favorited": "已收藏 {count} 条内容",
    "actions.batch_unfavorited": "已取消收藏 {count} 条内容",
    "actions.batch_archived": "已归档 {count} 条内容",
    "actions.batch_unarchived": "已取消归档 {count} 条内容",
    "actions.batch_deleted": "已删除 {count} 条内容",
    "actions.batch_add_to_collection": "加入合集",
    "actions.edit_note": "编辑备注",
    "actions.note_placeholder": "补一句说明，记录为什么留下它",
    "actions.save_note": "保存备注",
    "actions.clear_note": "清空备注",
    "actions.note_saved": "备注已保存",
    "actions.note_cleared": "备注已清空",
    "actions.note_failed": "备注更新失败",
    "actions.batch_add_tags": "批量加标签",
    "actions.batch_tags_added": "已为 {count} 条内容应用标签",
    "actions.edit_tags": "编辑标签",
    "actions.tags_placeholder": "输入标签，支持逗号或换行分隔",
    "actions.save_tags": "保存标签",
    "actions.clear_tags": "清空标签",
    "actions.tags_saved": "标签已保存",
    "actions.tags_cleared": "标签已清空",
    "actions.tags_failed": "标签更新失败",
    "actions.tags_empty": "当前没有标签可清空。",
    "actions.tags_required": "请先输入至少一个标签。",
    "duplicates.eyebrow": "Duplicate Groups",
    "duplicates.title": "重复组工作台",
    "duplicates.subtitle": "先按组看清楚，再决定保留哪一条。这里会把相同文件、相同链接和近乎相同的文本聚在一起，方便你批量收口。",
    "duplicates.filter_all": "全部",
    "duplicates.filter_asset": "文件",
    "duplicates.filter_url": "链接",
    "duplicates.filter_text": "文本",
    "duplicates.summary_groups": "重复组",
    "duplicates.summary_items": "重复内容",
    "duplicates.empty_title": "现在还没有可处理的重复组",
    "duplicates.empty_description": "等有重复文件、重复链接或重复文本后，这里会自动把它们聚在一起。",
    "duplicates.recommended": "建议保留",
    "duplicates.members": "组内内容",
    "duplicates.keep_recommended": "保留建议项",
    "duplicates.keep_newest": "保留最新",
    "duplicates.keep_oldest": "保留最早",
    "duplicates.keep_this": "保留这条",
    "duplicates.confirm_cleanup": "确定保留选中的内容，并删除本组其他 {count} 条重复项吗？",
    "duplicates.cleanup_done": "已清理 {count} 条重复项",
    "duplicates.cleanup_empty": "这组内容已经没有其他重复项了",
    "duplicates.cleanup_failed": "重复组清理失败",
    "duplicates.kind_asset": "文件重复",
    "duplicates.kind_url": "链接重复",
    "duplicates.kind_text": "文本重复",
    "duplicates.reason_pinned": "已置顶",
    "duplicates.reason_favorite": "已收藏",
    "duplicates.reason_shared": "已有分享",
    "duplicates.reason_active": "仍在进行中",
    "duplicates.reason_newest": "较新",
    "duplicates.latest": "最新",
    "duplicates.oldest": "最早",
    "duplicates.group_count": "{count} 条",
    "duplicates.member_assets": "{count} 个资源",
    "duplicates.reasons_label": "推荐原因",
    "duplicates.recommended_mark": "推荐",
    "duplicates.open_home": "回到时间流",
    "settings.eyebrow": "Settings",
    "settings.title": "基础设置",
    "settings.subtitle": "MVP 只保留最必要的个性化配置，避免把个人工具做成复杂后台。",
    "settings.form_title": "基础设置",
    "settings.form_description": "这里只保留 MVP 必要项，尽量简单且可直接使用。",
    "settings.app_name": "应用名称",
    "settings.share_base_url": "分享链接基础地址",
    "settings.share_base_url_help": "生成分享链接时会使用这个地址。",
    "settings.public_share_base_url": "公网分享地址",
    "settings.public_share_base_url_help": "外网访问时优先使用这个地址生成分享链接。",
    "settings.internal_share_base_url": "内网分享地址",
    "settings.internal_share_base_url_help": "局域网访问时会优先推荐这个地址；留空时会回退到当前内网访问地址。",
    "settings.storage_dir": "文件存储目录",
    "settings.storage_dir_help": "该路径由环境变量控制，设置页仅展示当前生效值。",
    "settings.save": "保存设置",
    "settings.saving": "保存中...",
    "settings.saved": "设置已保存",
    "share.title": "{appName} 分享内容",
    "share.description": "这是一个公开分享视图，内容保留原始发送来源和时间。",
    "share.collection_title": "{appName} 合集分享 · {title}",
    "share.collection_description": "这是一个公开合集视图，保留了原始发送来源和时间顺序。",
    "not_found.title": "内容不存在",
    "not_found.description": "这个分享链接可能已经失效，或者对应内容已被移除。",
    "not_found.back_home": "回到首页",
    "collections.eyebrow": "Collections",
    "collections.title": "合集",
    "collections.subtitle": "把分散的内容整理成一个主题板，适合沉淀项目资料、旅行清单、待发内容和灵感板。",
    "collections.create_title": "新建合集",
    "collections.create_description": "先起个标题和描述，后面可以继续往里加内容，也可以直接从时间流多选加入。",
    "collections.create": "创建合集",
    "collections.create_with_selection": "用已选内容创建合集",
    "collections.edit": "编辑合集",
    "collections.updated": "合集已更新",
    "collections.existing": "加入现有合集",
    "collections.title_placeholder": "合集标题",
    "collections.description_placeholder": "合集描述（可选）",
    "collections.title_required": "请先填写合集标题。",
    "collections.action_failed": "合集操作失败",
    "collections.added": "已将 {count} 条内容加入合集",
    "collections.created": "已创建合集「{title}」",
    "collections.no_description": "暂时还没有描述。",
    "collections.shared": "已分享",
    "collections.entry_count": "{count} 条内容",
    "collections.empty_title": "现在还没有合集",
    "collections.empty_description": "你可以先新建一个合集，或者回到时间流多选内容后直接加入合集。",
    "collections.empty_select_hint": "还没有现成合集，可以直接创建一个新合集并把当前选择放进去。",
    "collections.empty_items_title": "这个合集里还没有内容",
    "collections.empty_items_description": "回到时间流，多选内容后用“加入合集”把它们收进来。",
    "collections.back_to_all": "回到合集列表",
    "collections.move_up": "上移",
    "collections.move_down": "下移",
    "collections.remove_entry": "移出合集",
    "collections.confirm_remove_entry": "确定把这条内容移出合集吗？原始内容不会被删除。",
    "collections.confirm_delete": "确定删除这个合集吗？合集中的内容本身不会被删除。"
  },
  en: {
    "header.collections": "Collections",
    "header.settings": "Settings",
    "header.language": "Language",
    "header.duplicates": "Duplicates",
    "toolbar.stream": "Stream",
    "toolbar.count": "{count} items",
    "toolbar.clear": "Clear",
    "toolbar.search": "Search",
    "toolbar.collapse": "Collapse",
    "toolbar.search_placeholder": "Search messages, files, senders, or devices",
    "toolbar.only_duplicates": "Duplicates only",
    "toolbar.clear_filters": "Clear filters",
    "toolbar.saved_views": "Saved views",
    "toolbar.save_view": "Save view",
    "toolbar.save_view_placeholder": "Name this view",
    "toolbar.save_view_confirm": "Save",
    "toolbar.save_view_cancel": "Cancel",
    "toolbar.delete_view": "Delete view",
    "toolbar.confirm_delete_view": "Delete this saved view?",
    "toolbar.save_view_name_required": "Please enter a name for this view.",
    "toolbar.save_view_failed": "Could not save this view",
    "toolbar.delete_view_failed": "Could not delete this view",
    "toolbar.organize": "Bulk organize",
    "toolbar.selection_count": "{count} selected",
    "toolbar.select_all_visible": "Select visible",
    "toolbar.clear_selection": "Clear selection",
    "toolbar.exit_selection": "Exit organize",
    "toolbar.long_press_hint": "On phones, you can also long-press an item to enter multi-select.",
    "toolbar.all_tags": "All tags",
    "empty.title": "This space will flow like a chat timeline",
    "empty.description": "Send text, images, videos, PDFs, or any file from the composer below and they will appear here instantly.",
    "composer.empty_error": "Type a message or add at least one file.",
    "composer.new_content": "New content",
    "composer.pending_count": "{count} ready to send",
    "composer.ready_to_send": "Ready to send",
    "composer.instructions": "Text is sent as one message, while files are still sent one by one. Drag, paste, or pick files.",
    "composer.text_and_files": "Text and files share one composer",
    "composer.shortcut": "Shortcut Ctrl/Cmd + Enter",
    "composer.placeholder": "Write something, drop in a few images, or paste a screenshot...",
    "composer.pending_file": "Queued file",
    "composer.remove": "Remove",
    "composer.add_files": "Add files",
    "composer.clear_files": "Clear files",
    "composer.sending": "Sending...",
    "composer.send": "Send",
    "composer.send_count": "Send {count}",
    "composer.open": "Open",
    "composer.cta_title": "Send notes, files, and screenshots",
    "composer.cta_description": "Open the floating composer and drop new content into the stream",
    "entry.local_source": "Local device",
    "entry.favorite": "Favorite",
    "entry.archived": "Archived",
    "entry.pinned": "Pinned",
    "entry.duplicate": "{count} duplicates",
    "entry.note": "Note",
    "entry.share_revoked": "Share revoked",
    "entry.open": "Open",
    "entry.download": "Download",
    "entry.open_new_window": "Open in new window",
    "search.matches": "Matches",
    "search.source_message": "Message",
    "search.source_note": "Note",
    "search.source_asset_name": "File name",
    "search.source_asset_text": "File text",
    "search.source_sender": "Sender",
    "actions.processing": "Working...",
    "actions.copy_share": "Copy share link",
    "actions.copy_text": "Copy text",
    "actions.copy_image": "Copy image",
    "actions.more": "More actions",
    "actions.generate_share": "Create share link",
    "actions.revoke_share": "Revoke share",
    "actions.revoking": "Revoking...",
    "actions.delete": "Delete",
    "actions.deleting": "Deleting...",
    "actions.confirm_delete": "Delete this item? The attached files will be removed too.",
    "actions.share_copied": "Share link copied",
    "actions.share_generated": "Share link created",
    "actions.share_failed": "Share failed",
    "actions.share_revoked": "Share revoked",
    "actions.revoke_failed": "Revoke failed",
    "actions.deleted": "Item deleted",
    "actions.delete_failed": "Delete failed",
    "actions.copy_prompt": "Copy this share link",
    "actions.copy_failed": "Copy failed",
    "actions.copy_preferred_share": "Copy recommended",
    "actions.copy_public_share": "Public link",
    "actions.copy_internal_share": "Internal link",
    "actions.text_copied": "Text copied",
    "actions.image_copied": "Image copied",
    "actions.favorite": "Add to favorites",
    "actions.unfavorite": "Remove favorite",
    "actions.pin": "Pin",
    "actions.unpin": "Unpin",
    "actions.archive": "Archive",
    "actions.unarchive": "Unarchive",
    "actions.cleanup_duplicates": "Clean up other duplicates",
    "actions.favorite_added": "Added to favorites",
    "actions.favorite_removed": "Removed from favorites",
    "actions.favorite_failed": "Favorite update failed",
    "actions.pinned": "Pinned",
    "actions.unpinned": "Unpinned",
    "actions.pin_failed": "Pin update failed",
    "actions.archived": "Archived",
    "actions.unarchived": "Moved back to active",
    "actions.archive_failed": "Archive update failed",
    "actions.cleanup_duplicates_done": "Removed {count} duplicates",
    "actions.cleanup_duplicates_empty": "No other duplicates to clean up",
    "actions.cleanup_duplicates_failed": "Could not clean up duplicates",
    "actions.confirm_cleanup_duplicates": "Keep this item and remove the other duplicates?",
    "actions.preferred_share_copied": "Recommended link copied",
    "actions.public_share_copied": "Public link copied",
    "actions.internal_share_copied": "Internal link copied",
    "actions.public_share_unavailable": "Public share URL is unavailable",
    "actions.internal_share_unavailable": "Internal share URL is unavailable",
    "actions.select_item": "Select this item",
    "actions.deselect_item": "Deselect this item",
    "actions.batch_empty": "Select at least one item first.",
    "actions.batch_failed": "Bulk update failed",
    "actions.confirm_batch_delete": "Delete the {count} selected items? Attached files will be removed too.",
    "actions.batch_pinned": "Pinned {count} items",
    "actions.batch_unpinned": "Unpinned {count} items",
    "actions.batch_favorited": "Favorited {count} items",
    "actions.batch_unfavorited": "Removed {count} items from favorites",
    "actions.batch_archived": "Archived {count} items",
    "actions.batch_unarchived": "Moved {count} items back to active",
    "actions.batch_deleted": "Deleted {count} items",
    "actions.batch_add_to_collection": "Add to collection",
    "actions.edit_note": "Edit note",
    "actions.note_placeholder": "Add a short reminder about why this item matters",
    "actions.save_note": "Save note",
    "actions.clear_note": "Clear note",
    "actions.note_saved": "Note saved",
    "actions.note_cleared": "Note cleared",
    "actions.note_failed": "Could not update the note",
    "actions.batch_add_tags": "Add tags",
    "actions.batch_tags_added": "Applied tags to {count} items",
    "actions.edit_tags": "Edit tags",
    "actions.tags_placeholder": "Enter tags separated by commas or new lines",
    "actions.save_tags": "Save tags",
    "actions.clear_tags": "Clear tags",
    "actions.tags_saved": "Tags saved",
    "actions.tags_cleared": "Tags cleared",
    "actions.tags_failed": "Could not update tags",
    "actions.tags_empty": "There are no tags to clear.",
    "actions.tags_required": "Enter at least one tag first.",
    "duplicates.eyebrow": "Duplicate Groups",
    "duplicates.title": "Duplicate Workbench",
    "duplicates.subtitle": "Review duplicates in groups first, then decide which one to keep. Files, links, and repeated text are gathered here for cleanup.",
    "duplicates.filter_all": "All",
    "duplicates.filter_asset": "Files",
    "duplicates.filter_url": "Links",
    "duplicates.filter_text": "Text",
    "duplicates.summary_groups": "Groups",
    "duplicates.summary_items": "Duplicate items",
    "duplicates.empty_title": "No duplicate groups to process yet",
    "duplicates.empty_description": "Once duplicate files, links, or text appear, they will be grouped here automatically.",
    "duplicates.recommended": "Recommended keep",
    "duplicates.members": "Group items",
    "duplicates.keep_recommended": "Keep recommended",
    "duplicates.keep_newest": "Keep newest",
    "duplicates.keep_oldest": "Keep oldest",
    "duplicates.keep_this": "Keep this one",
    "duplicates.confirm_cleanup": "Keep the selected item and delete the other {count} duplicates in this group?",
    "duplicates.cleanup_done": "Removed {count} duplicates",
    "duplicates.cleanup_empty": "This group has no other duplicates left",
    "duplicates.cleanup_failed": "Duplicate cleanup failed",
    "duplicates.kind_asset": "File duplicates",
    "duplicates.kind_url": "Link duplicates",
    "duplicates.kind_text": "Text duplicates",
    "duplicates.reason_pinned": "Pinned",
    "duplicates.reason_favorite": "Favorited",
    "duplicates.reason_shared": "Shared",
    "duplicates.reason_active": "Still active",
    "duplicates.reason_newest": "Newest",
    "duplicates.latest": "Latest",
    "duplicates.oldest": "Oldest",
    "duplicates.group_count": "{count} items",
    "duplicates.member_assets": "{count} assets",
    "duplicates.reasons_label": "Why it is recommended",
    "duplicates.recommended_mark": "Recommended",
    "duplicates.open_home": "Back to stream",
    "settings.eyebrow": "Settings",
    "settings.title": "Preferences",
    "settings.subtitle": "The MVP keeps only the essentials so your personal tool stays simple.",
    "settings.form_title": "Preferences",
    "settings.form_description": "Only the minimum settings are exposed here so the app stays easy to use.",
    "settings.app_name": "App name",
    "settings.share_base_url": "Share base URL",
    "settings.share_base_url_help": "Generated share links use this base URL.",
    "settings.public_share_base_url": "Public share URL",
    "settings.public_share_base_url_help": "External sharing uses this URL by default.",
    "settings.internal_share_base_url": "Internal share URL",
    "settings.internal_share_base_url_help": "LAN access prefers this URL. Leave it empty to fall back to the current internal address.",
    "settings.storage_dir": "Storage directory",
    "settings.storage_dir_help": "This value comes from environment variables and is shown here for reference.",
    "settings.save": "Save settings",
    "settings.saving": "Saving...",
    "settings.saved": "Settings saved",
    "share.title": "{appName} shared item",
    "share.description": "This is a public share view and keeps the original sender and timestamp.",
    "share.collection_title": "{appName} shared collection · {title}",
    "share.collection_description": "This is a public collection view that keeps the original sender and timeline order.",
    "not_found.title": "Content not found",
    "not_found.description": "This share link may have expired or the original item was removed.",
    "not_found.back_home": "Back to home",
    "collections.eyebrow": "Collections",
    "collections.title": "Collections",
    "collections.subtitle": "Group scattered items into reusable boards for project materials, trip lists, pending shares, and inspiration stacks.",
    "collections.create_title": "Create collection",
    "collections.create_description": "Start with a title and description, then keep adding items later or add them directly from multi-select in the stream.",
    "collections.create": "Create collection",
    "collections.create_with_selection": "Create from selected items",
    "collections.edit": "Edit collection",
    "collections.updated": "Collection updated",
    "collections.existing": "Add to existing collection",
    "collections.title_placeholder": "Collection title",
    "collections.description_placeholder": "Collection description (optional)",
    "collections.title_required": "Please enter a collection title first.",
    "collections.action_failed": "Collection action failed",
    "collections.added": "Added {count} items to the collection",
    "collections.created": "Created collection \"{title}\"",
    "collections.no_description": "No description yet.",
    "collections.shared": "Shared",
    "collections.entry_count": "{count} items",
    "collections.empty_title": "No collections yet",
    "collections.empty_description": "Create one here, or head back to the stream and add selected items into a new collection.",
    "collections.empty_select_hint": "There are no collections yet. Create one here and drop the current selection into it.",
    "collections.empty_items_title": "This collection is still empty",
    "collections.empty_items_description": "Go back to the stream and use multi-select to add items into it.",
    "collections.back_to_all": "Back to all collections",
    "collections.move_up": "Move up",
    "collections.move_down": "Move down",
    "collections.remove_entry": "Remove from collection",
    "collections.confirm_remove_entry": "Remove this item from the collection? The original item will stay in your stream.",
    "collections.confirm_delete": "Delete this collection? The items inside it will stay in your stream."
  },
  ja: {
    "header.settings": "設定",
    "header.language": "言語",
    "header.duplicates": "重複グループ",
    "toolbar.stream": "タイムライン",
    "toolbar.count": "{count} 件",
    "toolbar.clear": "クリア",
    "toolbar.search": "検索",
    "toolbar.collapse": "閉じる",
    "toolbar.search_placeholder": "メッセージ、ファイル名、送信元、端末で検索",
    "toolbar.only_duplicates": "重複のみ",
    "toolbar.clear_filters": "条件をクリア",
    "toolbar.saved_views": "保存済みビュー",
    "toolbar.save_view": "ビューを保存",
    "toolbar.save_view_placeholder": "ビュー名を入力",
    "toolbar.save_view_confirm": "保存",
    "toolbar.save_view_cancel": "キャンセル",
    "toolbar.delete_view": "ビューを削除",
    "toolbar.confirm_delete_view": "この保存済みビューを削除しますか？",
    "toolbar.save_view_name_required": "ビュー名を入力してください。",
    "toolbar.save_view_failed": "ビューを保存できませんでした",
    "toolbar.delete_view_failed": "ビューを削除できませんでした",
    "toolbar.organize": "一括整理",
    "toolbar.selection_count": "{count} 件を選択中",
    "toolbar.select_all_visible": "表示中を全選択",
    "toolbar.clear_selection": "選択をクリア",
    "toolbar.exit_selection": "整理を終了",
    "toolbar.long_press_hint": "モバイルでは内容を長押しして複数選択に入れます。",
    "toolbar.all_tags": "すべてのタグ",
    "empty.title": "ここはチャットのように流れるタイムラインです",
    "empty.description": "下の入力欄からテキスト、画像、動画、PDF、その他のファイルを送ると、すぐにここへ表示されます。",
    "composer.empty_error": "テキストを入力するか、少なくとも 1 つのファイルを追加してください。",
    "composer.new_content": "新しい内容",
    "composer.pending_count": "{count} 件送信待ち",
    "composer.ready_to_send": "送信準備完了",
    "composer.instructions": "テキストは 1 つのメッセージとして送信され、ファイルは 1 件ずつ送信されます。ドラッグ、貼り付け、選択に対応しています。",
    "composer.text_and_files": "テキストとファイルを 1 つの入力欄で扱えます",
    "composer.shortcut": "ショートカット Ctrl/Cmd + Enter",
    "composer.placeholder": "テキストを書いたり、画像をドラッグしたり、スクリーンショットを貼り付けたりできます...",
    "composer.pending_file": "送信待ちファイル",
    "composer.remove": "削除",
    "composer.add_files": "ファイルを追加",
    "composer.clear_files": "添付をクリア",
    "composer.sending": "送信中...",
    "composer.send": "送信",
    "composer.send_count": "{count} 件送信",
    "composer.open": "開く",
    "composer.cta_title": "メッセージ、ファイル、スクリーンショットを送信",
    "composer.cta_description": "入力欄を開いて新しい内容をタイムラインに追加します",
    "entry.local_source": "ローカル端末",
    "entry.favorite": "お気に入り",
    "entry.archived": "アーカイブ済み",
    "entry.pinned": "固定済み",
    "entry.duplicate": "重複 {count} 件",
    "entry.share_revoked": "共有は無効化されました",
    "entry.open": "開く",
    "entry.download": "ダウンロード",
    "entry.open_new_window": "新しいウィンドウで開く",
    "search.matches": "一致箇所",
    "search.source_message": "本文",
    "search.source_asset_name": "ファイル名",
    "search.source_asset_text": "ファイル内容",
    "search.source_sender": "送信元",
    "actions.processing": "処理中...",
    "actions.copy_share": "共有リンクをコピー",
    "actions.copy_text": "テキストをコピー",
    "actions.copy_image": "画像をコピー",
    "actions.more": "その他の操作",
    "actions.generate_share": "共有リンクを作成",
    "actions.revoke_share": "共有を無効化",
    "actions.revoking": "無効化中...",
    "actions.delete": "削除",
    "actions.deleting": "削除中...",
    "actions.confirm_delete": "この内容を削除しますか？添付ファイルも削除されます。",
    "actions.share_copied": "共有リンクをコピーしました",
    "actions.share_generated": "共有リンクを作成しました",
    "actions.share_failed": "共有に失敗しました",
    "actions.share_revoked": "共有を無効化しました",
    "actions.revoke_failed": "無効化に失敗しました",
    "actions.deleted": "内容を削除しました",
    "actions.delete_failed": "削除に失敗しました",
    "actions.copy_prompt": "この共有リンクをコピーしてください",
    "actions.copy_failed": "コピーに失敗しました",
    "actions.copy_preferred_share": "おすすめをコピー",
    "actions.copy_public_share": "公開リンク",
    "actions.copy_internal_share": "内部リンク",
    "actions.text_copied": "テキストをコピーしました",
    "actions.image_copied": "画像をコピーしました",
    "actions.favorite": "お気に入りに追加",
    "actions.unfavorite": "お気に入りから外す",
    "actions.pin": "固定する",
    "actions.unpin": "固定を解除",
    "actions.archive": "アーカイブ",
    "actions.unarchive": "アーカイブを解除",
    "actions.cleanup_duplicates": "他の重複を整理",
    "actions.favorite_added": "お気に入りに追加しました",
    "actions.favorite_removed": "お気に入りから外しました",
    "actions.favorite_failed": "お気に入りの更新に失敗しました",
    "actions.pinned": "固定しました",
    "actions.unpinned": "固定を解除しました",
    "actions.pin_failed": "固定の更新に失敗しました",
    "actions.archived": "アーカイブしました",
    "actions.unarchived": "アクティブに戻しました",
    "actions.archive_failed": "アーカイブの更新に失敗しました",
    "actions.cleanup_duplicates_done": "{count} 件の重複を整理しました",
    "actions.cleanup_duplicates_empty": "整理する重複はありません",
    "actions.cleanup_duplicates_failed": "重複の整理に失敗しました",
    "actions.confirm_cleanup_duplicates": "この内容を残して、他の重複を削除しますか？",
    "actions.preferred_share_copied": "おすすめリンクをコピーしました",
    "actions.public_share_copied": "公開リンクをコピーしました",
    "actions.internal_share_copied": "内部リンクをコピーしました",
    "actions.public_share_unavailable": "公開共有 URL は利用できません",
    "actions.internal_share_unavailable": "内部共有 URL は利用できません",
    "actions.select_item": "この内容を選択",
    "actions.deselect_item": "この内容の選択を解除",
    "actions.batch_empty": "少なくとも 1 件選択してください。",
    "actions.batch_failed": "一括操作に失敗しました",
    "actions.confirm_batch_delete": "選択した {count} 件を削除しますか？添付ファイルも削除されます。",
    "actions.batch_pinned": "{count} 件を固定しました",
    "actions.batch_unpinned": "{count} 件の固定を解除しました",
    "actions.batch_favorited": "{count} 件をお気に入りに追加しました",
    "actions.batch_unfavorited": "{count} 件をお気に入りから外しました",
    "actions.batch_archived": "{count} 件をアーカイブしました",
    "actions.batch_unarchived": "{count} 件をアクティブに戻しました",
    "actions.batch_deleted": "{count} 件を削除しました",
    "actions.batch_add_tags": "タグを追加",
    "actions.batch_tags_added": "{count} 件にタグを適用しました",
    "actions.edit_tags": "タグを編集",
    "actions.tags_placeholder": "タグを入力してください。カンマや改行で区切れます",
    "actions.save_tags": "タグを保存",
    "actions.clear_tags": "タグをクリア",
    "actions.tags_saved": "タグを保存しました",
    "actions.tags_cleared": "タグをクリアしました",
    "actions.tags_failed": "タグを更新できませんでした",
    "actions.tags_empty": "クリアするタグはありません。",
    "actions.tags_required": "少なくとも 1 つタグを入力してください。",
    "duplicates.eyebrow": "Duplicate Groups",
    "duplicates.title": "重複グループ作業台",
    "duplicates.subtitle": "まずグループで見比べてから、どれを残すか決められます。同じファイル、同じリンク、近い本文をここにまとめます。",
    "duplicates.filter_all": "すべて",
    "duplicates.filter_asset": "ファイル",
    "duplicates.filter_url": "リンク",
    "duplicates.filter_text": "テキスト",
    "duplicates.summary_groups": "グループ数",
    "duplicates.summary_items": "重複内容",
    "duplicates.empty_title": "今は処理できる重複グループがありません",
    "duplicates.empty_description": "重複したファイル、リンク、テキストが入ると、ここへ自動的にまとまります。",
    "duplicates.recommended": "推奨保持",
    "duplicates.members": "グループ内の内容",
    "duplicates.keep_recommended": "推奨を残す",
    "duplicates.keep_newest": "最新を残す",
    "duplicates.keep_oldest": "最古を残す",
    "duplicates.keep_this": "この内容を残す",
    "duplicates.confirm_cleanup": "選択した内容を残し、このグループの他の {count} 件を削除しますか？",
    "duplicates.cleanup_done": "{count} 件の重複を整理しました",
    "duplicates.cleanup_empty": "このグループに他の重複は残っていません",
    "duplicates.cleanup_failed": "重複グループの整理に失敗しました",
    "duplicates.kind_asset": "ファイル重複",
    "duplicates.kind_url": "リンク重複",
    "duplicates.kind_text": "テキスト重複",
    "duplicates.reason_pinned": "固定済み",
    "duplicates.reason_favorite": "お気に入り",
    "duplicates.reason_shared": "共有中",
    "duplicates.reason_active": "アクティブ",
    "duplicates.reason_newest": "新しい内容",
    "duplicates.latest": "最新",
    "duplicates.oldest": "最古",
    "duplicates.group_count": "{count} 件",
    "duplicates.member_assets": "{count} 件のファイル",
    "duplicates.reasons_label": "推奨理由",
    "duplicates.recommended_mark": "推奨",
    "duplicates.open_home": "タイムラインへ戻る",
    "settings.eyebrow": "Settings",
    "settings.title": "基本設定",
    "settings.subtitle": "MVP では本当に必要な設定だけを残し、個人用ツールを複雑にしません。",
    "settings.form_title": "基本設定",
    "settings.form_description": "使いやすさを保つため、ここでは最低限の設定のみ表示します。",
    "settings.app_name": "アプリ名",
    "settings.share_base_url": "共有リンクのベース URL",
    "settings.share_base_url_help": "共有リンク生成時にこの URL を使用します。",
    "settings.public_share_base_url": "公開共有 URL",
    "settings.public_share_base_url_help": "外部共有ではこの URL を優先して使います。",
    "settings.internal_share_base_url": "内部共有 URL",
    "settings.internal_share_base_url_help": "LAN アクセス時はこの URL を優先します。空欄なら現在の内部アクセス先にフォールバックします。",
    "settings.storage_dir": "保存ディレクトリ",
    "settings.storage_dir_help": "この値は環境変数から取得され、ここでは参照用に表示されます。",
    "settings.save": "設定を保存",
    "settings.saving": "保存中...",
    "settings.saved": "設定を保存しました",
    "share.title": "{appName} の共有内容",
    "share.description": "これは公開共有ビューで、元の送信元と時刻を保持します。",
    "not_found.title": "内容が見つかりません",
    "not_found.description": "この共有リンクは無効になったか、元の内容が削除された可能性があります。",
    "not_found.back_home": "ホームへ戻る"
  },
  fr: {
    "header.settings": "Parametres",
    "header.language": "Langue",
    "header.duplicates": "Doublons",
    "toolbar.stream": "Flux",
    "toolbar.count": "{count} elements",
    "toolbar.clear": "Effacer",
    "toolbar.search": "Rechercher",
    "toolbar.collapse": "Reduire",
    "toolbar.search_placeholder": "Rechercher dans les messages, fichiers, expéditeurs ou appareils",
    "toolbar.only_duplicates": "Doublons uniquement",
    "toolbar.clear_filters": "Effacer les filtres",
    "toolbar.saved_views": "Vues enregistrees",
    "toolbar.save_view": "Enregistrer la vue",
    "toolbar.save_view_placeholder": "Nommer cette vue",
    "toolbar.save_view_confirm": "Enregistrer",
    "toolbar.save_view_cancel": "Annuler",
    "toolbar.delete_view": "Supprimer la vue",
    "toolbar.confirm_delete_view": "Supprimer cette vue enregistree ?",
    "toolbar.save_view_name_required": "Saisissez un nom pour cette vue.",
    "toolbar.save_view_failed": "Impossible d'enregistrer cette vue",
    "toolbar.delete_view_failed": "Impossible de supprimer cette vue",
    "toolbar.organize": "Tri en lot",
    "toolbar.selection_count": "{count} selectionnes",
    "toolbar.select_all_visible": "Tout selectionner",
    "toolbar.clear_selection": "Effacer la selection",
    "toolbar.exit_selection": "Quitter le tri",
    "toolbar.long_press_hint": "Sur mobile, un appui long sur un element ouvre aussi la multi-selection.",
    "toolbar.all_tags": "Tous les tags",
    "empty.title": "Cet espace suit le rythme d'une conversation",
    "empty.description": "Envoyez du texte, des images, des vidéos, des PDF ou tout autre fichier depuis la zone du bas pour les voir apparaitre ici instantanément.",
    "composer.empty_error": "Saisissez un message ou ajoutez au moins un fichier.",
    "composer.new_content": "Nouveau contenu",
    "composer.pending_count": "{count} a envoyer",
    "composer.ready_to_send": "Pret a envoyer",
    "composer.instructions": "Le texte est envoye comme un seul message, tandis que les fichiers sont toujours envoyes un par un. Glissez, collez ou choisissez des fichiers.",
    "composer.text_and_files": "Texte et fichiers partagent le meme composeur",
    "composer.shortcut": "Raccourci Ctrl/Cmd + Enter",
    "composer.placeholder": "Ecrivez un message, glissez quelques images ou collez une capture...",
    "composer.pending_file": "Fichier en attente",
    "composer.remove": "Retirer",
    "composer.add_files": "Ajouter des fichiers",
    "composer.clear_files": "Vider les fichiers",
    "composer.sending": "Envoi...",
    "composer.send": "Envoyer",
    "composer.send_count": "Envoyer {count}",
    "composer.open": "Ouvrir",
    "composer.cta_title": "Envoyer messages, fichiers et captures",
    "composer.cta_description": "Ouvrez le composeur flottant pour ajouter du nouveau contenu au flux",
    "entry.local_source": "Appareil local",
    "entry.favorite": "Favori",
    "entry.archived": "Archive",
    "entry.pinned": "Epingle",
    "entry.duplicate": "{count} doublons",
    "entry.share_revoked": "Partage revoque",
    "entry.open": "Ouvrir",
    "entry.download": "Telecharger",
    "entry.open_new_window": "Ouvrir dans une nouvelle fenetre",
    "search.matches": "Correspondances",
    "search.source_message": "Message",
    "search.source_asset_name": "Nom du fichier",
    "search.source_asset_text": "Texte du fichier",
    "search.source_sender": "Expediteur",
    "actions.processing": "Traitement...",
    "actions.copy_share": "Copier le lien",
    "actions.copy_text": "Copier le texte",
    "actions.copy_image": "Copier l'image",
    "actions.more": "Plus d'actions",
    "actions.generate_share": "Generer le lien",
    "actions.revoke_share": "Revoquer le partage",
    "actions.revoking": "Revocation...",
    "actions.delete": "Supprimer",
    "actions.deleting": "Suppression...",
    "actions.confirm_delete": "Supprimer cet element ? Les fichiers associes seront aussi supprimes.",
    "actions.share_copied": "Lien copie",
    "actions.share_generated": "Lien genere",
    "actions.share_failed": "Echec du partage",
    "actions.share_revoked": "Partage revoque",
    "actions.revoke_failed": "Echec de la revocation",
    "actions.deleted": "Element supprime",
    "actions.delete_failed": "Echec de la suppression",
    "actions.copy_prompt": "Copiez ce lien de partage",
    "actions.copy_failed": "Echec de la copie",
    "actions.copy_preferred_share": "Copier le lien recommande",
    "actions.copy_public_share": "Lien public",
    "actions.copy_internal_share": "Lien interne",
    "actions.text_copied": "Texte copie",
    "actions.image_copied": "Image copiee",
    "actions.favorite": "Ajouter aux favoris",
    "actions.unfavorite": "Retirer des favoris",
    "actions.pin": "Epingler",
    "actions.unpin": "Retirer l'epingle",
    "actions.archive": "Archiver",
    "actions.unarchive": "Retirer de l'archive",
    "actions.cleanup_duplicates": "Nettoyer les autres doublons",
    "actions.favorite_added": "Ajoute aux favoris",
    "actions.favorite_removed": "Retire des favoris",
    "actions.favorite_failed": "Echec de la mise a jour des favoris",
    "actions.pinned": "Epingle",
    "actions.unpinned": "Epingle retiree",
    "actions.pin_failed": "Echec de la mise a jour de l'epingle",
    "actions.archived": "Archive",
    "actions.unarchived": "Remis dans le flux actif",
    "actions.archive_failed": "Echec de la mise a jour de l'archive",
    "actions.cleanup_duplicates_done": "{count} doublons supprimes",
    "actions.cleanup_duplicates_empty": "Aucun autre doublon a nettoyer",
    "actions.cleanup_duplicates_failed": "Impossible de nettoyer les doublons",
    "actions.confirm_cleanup_duplicates": "Conserver cet element et supprimer les autres doublons ?",
    "actions.preferred_share_copied": "Lien recommande copie",
    "actions.public_share_copied": "Lien public copie",
    "actions.internal_share_copied": "Lien interne copie",
    "actions.public_share_unavailable": "L'URL de partage public est indisponible",
    "actions.internal_share_unavailable": "L'URL de partage interne est indisponible",
    "actions.select_item": "Selectionner cet element",
    "actions.deselect_item": "Retirer cet element de la selection",
    "actions.batch_empty": "Selectionnez au moins un element.",
    "actions.batch_failed": "Echec de l'action en lot",
    "actions.confirm_batch_delete": "Supprimer les {count} elements selectionnes ? Les fichiers associes seront aussi supprimes.",
    "actions.batch_pinned": "{count} elements epingles",
    "actions.batch_unpinned": "{count} elements desepingles",
    "actions.batch_favorited": "{count} elements ajoutes aux favoris",
    "actions.batch_unfavorited": "{count} elements retires des favoris",
    "actions.batch_archived": "{count} elements archives",
    "actions.batch_unarchived": "{count} elements remis dans le flux actif",
    "actions.batch_deleted": "{count} elements supprimes",
    "actions.batch_add_tags": "Ajouter des tags",
    "actions.batch_tags_added": "Tags appliques a {count} elements",
    "actions.edit_tags": "Modifier les tags",
    "actions.tags_placeholder": "Saisissez des tags, separes par des virgules ou des retours a la ligne",
    "actions.save_tags": "Enregistrer les tags",
    "actions.clear_tags": "Effacer les tags",
    "actions.tags_saved": "Tags enregistres",
    "actions.tags_cleared": "Tags effaces",
    "actions.tags_failed": "Impossible de mettre a jour les tags",
    "actions.tags_empty": "Aucun tag a effacer.",
    "actions.tags_required": "Saisissez au moins un tag.",
    "duplicates.eyebrow": "Duplicate Groups",
    "duplicates.title": "Atelier des doublons",
    "duplicates.subtitle": "Examinez d'abord les doublons par groupe, puis choisissez quoi conserver. Les fichiers, liens et textes repetes sont regroupes ici.",
    "duplicates.filter_all": "Tout",
    "duplicates.filter_asset": "Fichiers",
    "duplicates.filter_url": "Liens",
    "duplicates.filter_text": "Texte",
    "duplicates.summary_groups": "Groupes",
    "duplicates.summary_items": "Elements en doublon",
    "duplicates.empty_title": "Aucun groupe de doublons a traiter pour le moment",
    "duplicates.empty_description": "Quand des fichiers, liens ou textes en doublon apparaitront, ils seront regroupes ici automatiquement.",
    "duplicates.recommended": "Conserver de preference",
    "duplicates.members": "Elements du groupe",
    "duplicates.keep_recommended": "Garder la recommandation",
    "duplicates.keep_newest": "Garder le plus recent",
    "duplicates.keep_oldest": "Garder le plus ancien",
    "duplicates.keep_this": "Garder cet element",
    "duplicates.confirm_cleanup": "Conserver l'element selectionne et supprimer les {count} autres doublons de ce groupe ?",
    "duplicates.cleanup_done": "{count} doublons supprimes",
    "duplicates.cleanup_empty": "Ce groupe n'a plus d'autre doublon",
    "duplicates.cleanup_failed": "Le nettoyage des doublons a echoue",
    "duplicates.kind_asset": "Doublons de fichiers",
    "duplicates.kind_url": "Doublons de liens",
    "duplicates.kind_text": "Doublons de texte",
    "duplicates.reason_pinned": "Epingle",
    "duplicates.reason_favorite": "Favori",
    "duplicates.reason_shared": "Deja partage",
    "duplicates.reason_active": "Toujours actif",
    "duplicates.reason_newest": "Le plus recent",
    "duplicates.latest": "Plus recent",
    "duplicates.oldest": "Plus ancien",
    "duplicates.group_count": "{count} elements",
    "duplicates.member_assets": "{count} fichiers",
    "duplicates.reasons_label": "Pourquoi cette recommandation",
    "duplicates.recommended_mark": "Recommande",
    "duplicates.open_home": "Retour au flux",
    "settings.eyebrow": "Settings",
    "settings.title": "Parametres",
    "settings.subtitle": "Le MVP ne conserve que l'essentiel afin que l'outil reste simple.",
    "settings.form_title": "Parametres",
    "settings.form_description": "Seuls les reglages necessaires sont exposes ici pour garder une utilisation simple.",
    "settings.app_name": "Nom de l'application",
    "settings.share_base_url": "URL de base des partages",
    "settings.share_base_url_help": "Les liens generes utiliseront cette URL de base.",
    "settings.public_share_base_url": "URL de partage public",
    "settings.public_share_base_url_help": "Les partages externes utilisent cette URL par defaut.",
    "settings.internal_share_base_url": "URL de partage interne",
    "settings.internal_share_base_url_help": "En reseau local, cette URL est privilegiee. Laissez vide pour reutiliser l'adresse interne actuelle.",
    "settings.storage_dir": "Repertoire de stockage",
    "settings.storage_dir_help": "Cette valeur vient des variables d'environnement et est affichee ici a titre indicatif.",
    "settings.save": "Enregistrer",
    "settings.saving": "Enregistrement...",
    "settings.saved": "Parametres enregistres",
    "share.title": "Contenu partage de {appName}",
    "share.description": "Ceci est une vue publique qui conserve l'expediteur et l'heure d'origine.",
    "not_found.title": "Contenu introuvable",
    "not_found.description": "Ce lien de partage a peut-etre expire ou l'element d'origine a ete supprime.",
    "not_found.back_home": "Retour a l'accueil"
  },
  de: {
    "header.settings": "Einstellungen",
    "header.language": "Sprache",
    "header.duplicates": "Duplikate",
    "toolbar.stream": "Stream",
    "toolbar.count": "{count} Eintraege",
    "toolbar.clear": "Zuruecksetzen",
    "toolbar.search": "Suchen",
    "toolbar.collapse": "Schliessen",
    "toolbar.search_placeholder": "Nach Nachrichten, Dateien, Sendern oder Geraeten suchen",
    "toolbar.only_duplicates": "Nur Duplikate",
    "toolbar.clear_filters": "Filter loeschen",
    "toolbar.saved_views": "Gespeicherte Ansichten",
    "toolbar.save_view": "Ansicht speichern",
    "toolbar.save_view_placeholder": "Ansicht benennen",
    "toolbar.save_view_confirm": "Speichern",
    "toolbar.save_view_cancel": "Abbrechen",
    "toolbar.delete_view": "Ansicht loeschen",
    "toolbar.confirm_delete_view": "Diese gespeicherte Ansicht loeschen?",
    "toolbar.save_view_name_required": "Bitte einen Namen fuer diese Ansicht eingeben.",
    "toolbar.save_view_failed": "Ansicht konnte nicht gespeichert werden",
    "toolbar.delete_view_failed": "Ansicht konnte nicht geloescht werden",
    "toolbar.organize": "Stapelaktion",
    "toolbar.selection_count": "{count} ausgewaehlt",
    "toolbar.select_all_visible": "Sichtbare auswaehlen",
    "toolbar.clear_selection": "Auswahl leeren",
    "toolbar.exit_selection": "Aktion verlassen",
    "toolbar.long_press_hint": "Auf dem Handy startet ein langer Druck ebenfalls die Mehrfachauswahl.",
    "toolbar.all_tags": "Alle Tags",
    "empty.title": "Dieser Bereich verhaelt sich wie ein Chat-Verlauf",
    "empty.description": "Sende unten Text, Bilder, Videos, PDFs oder beliebige Dateien und sie erscheinen sofort in der Timeline.",
    "composer.empty_error": "Gib eine Nachricht ein oder fuege mindestens eine Datei hinzu.",
    "composer.new_content": "Neuer Inhalt",
    "composer.pending_count": "{count} bereit zum Senden",
    "composer.ready_to_send": "Bereit zum Senden",
    "composer.instructions": "Text wird als eine Nachricht gesendet, Dateien weiterhin einzeln. Ziehen, einfuegen oder auswaehlen ist moeglich.",
    "composer.text_and_files": "Text und Dateien teilen sich ein Eingabefeld",
    "composer.shortcut": "Shortcut Ctrl/Cmd + Enter",
    "composer.placeholder": "Schreibe etwas, ziehe Bilder hinein oder fuege einen Screenshot ein...",
    "composer.pending_file": "Datei in Warteschlange",
    "composer.remove": "Entfernen",
    "composer.add_files": "Dateien hinzufuegen",
    "composer.clear_files": "Anhaenge leeren",
    "composer.sending": "Wird gesendet...",
    "composer.send": "Senden",
    "composer.send_count": "{count} senden",
    "composer.open": "Oeffnen",
    "composer.cta_title": "Nachrichten, Dateien und Screenshots senden",
    "composer.cta_description": "Oeffne den schwebenden Composer und wirf neue Inhalte in den Stream",
    "entry.local_source": "Lokales Geraet",
    "entry.favorite": "Favorit",
    "entry.archived": "Archiviert",
    "entry.pinned": "Angeheftet",
    "entry.duplicate": "{count} Duplikate",
    "entry.share_revoked": "Freigabe widerrufen",
    "entry.open": "Oeffnen",
    "entry.download": "Herunterladen",
    "entry.open_new_window": "Im neuen Fenster oeffnen",
    "search.matches": "Treffer",
    "search.source_message": "Nachricht",
    "search.source_asset_name": "Dateiname",
    "search.source_asset_text": "Dateitext",
    "search.source_sender": "Absender",
    "actions.processing": "Wird verarbeitet...",
    "actions.copy_share": "Link kopieren",
    "actions.copy_text": "Text kopieren",
    "actions.copy_image": "Bild kopieren",
    "actions.more": "Weitere Aktionen",
    "actions.generate_share": "Link erstellen",
    "actions.revoke_share": "Freigabe widerrufen",
    "actions.revoking": "Widerruf...",
    "actions.delete": "Loeschen",
    "actions.deleting": "Loescht...",
    "actions.confirm_delete": "Diesen Eintrag loeschen? Zugehoerige Dateien werden ebenfalls entfernt.",
    "actions.share_copied": "Link kopiert",
    "actions.share_generated": "Link erstellt",
    "actions.share_failed": "Freigabe fehlgeschlagen",
    "actions.share_revoked": "Freigabe widerrufen",
    "actions.revoke_failed": "Widerruf fehlgeschlagen",
    "actions.deleted": "Eintrag geloescht",
    "actions.delete_failed": "Loeschen fehlgeschlagen",
    "actions.copy_prompt": "Diesen Freigabelink kopieren",
    "actions.copy_failed": "Kopieren fehlgeschlagen",
    "actions.copy_preferred_share": "Empfohlenen Link kopieren",
    "actions.copy_public_share": "Oeffentlicher Link",
    "actions.copy_internal_share": "Interner Link",
    "actions.text_copied": "Text kopiert",
    "actions.image_copied": "Bild kopiert",
    "actions.favorite": "Zu Favoriten",
    "actions.unfavorite": "Favorit entfernen",
    "actions.pin": "Anheften",
    "actions.unpin": "Loesen",
    "actions.archive": "Archivieren",
    "actions.unarchive": "Archiv aufheben",
    "actions.cleanup_duplicates": "Andere Duplikate bereinigen",
    "actions.favorite_added": "Zu Favoriten hinzugefuegt",
    "actions.favorite_removed": "Favorit entfernt",
    "actions.favorite_failed": "Favoriten konnten nicht aktualisiert werden",
    "actions.pinned": "Angeheftet",
    "actions.unpinned": "Loesung aufgehoben",
    "actions.pin_failed": "Anheften fehlgeschlagen",
    "actions.archived": "Archiviert",
    "actions.unarchived": "Wieder aktiv",
    "actions.archive_failed": "Archivstatus konnte nicht aktualisiert werden",
    "actions.cleanup_duplicates_done": "{count} Duplikate entfernt",
    "actions.cleanup_duplicates_empty": "Keine weiteren Duplikate zum Bereinigen",
    "actions.cleanup_duplicates_failed": "Duplikate konnten nicht bereinigt werden",
    "actions.confirm_cleanup_duplicates": "Diesen Eintrag behalten und die anderen Duplikate loeschen?",
    "actions.preferred_share_copied": "Empfohlener Link kopiert",
    "actions.public_share_copied": "Oeffentlicher Link kopiert",
    "actions.internal_share_copied": "Interner Link kopiert",
    "actions.public_share_unavailable": "Oeffentliche Freigabe-URL ist nicht verfuegbar",
    "actions.internal_share_unavailable": "Interne Freigabe-URL ist nicht verfuegbar",
    "actions.select_item": "Diesen Eintrag auswaehlen",
    "actions.deselect_item": "Auswahl fuer diesen Eintrag aufheben",
    "actions.batch_empty": "Bitte zuerst mindestens einen Eintrag auswaehlen.",
    "actions.batch_failed": "Stapelaktion fehlgeschlagen",
    "actions.confirm_batch_delete": "Die {count} ausgewaehlten Eintraege loeschen? Zugehoerige Dateien werden ebenfalls entfernt.",
    "actions.batch_pinned": "{count} Eintraege angeheftet",
    "actions.batch_unpinned": "{count} Eintraege geloest",
    "actions.batch_favorited": "{count} Eintraege zu Favoriten hinzugefuegt",
    "actions.batch_unfavorited": "{count} Eintraege aus Favoriten entfernt",
    "actions.batch_archived": "{count} Eintraege archiviert",
    "actions.batch_unarchived": "{count} Eintraege wieder aktiviert",
    "actions.batch_deleted": "{count} Eintraege geloescht",
    "actions.batch_add_tags": "Tags hinzufuegen",
    "actions.batch_tags_added": "Tags auf {count} Eintraege angewendet",
    "actions.edit_tags": "Tags bearbeiten",
    "actions.tags_placeholder": "Tags eingeben, getrennt durch Kommas oder Zeilenumbrueche",
    "actions.save_tags": "Tags speichern",
    "actions.clear_tags": "Tags leeren",
    "actions.tags_saved": "Tags gespeichert",
    "actions.tags_cleared": "Tags entfernt",
    "actions.tags_failed": "Tags konnten nicht aktualisiert werden",
    "actions.tags_empty": "Es gibt keine Tags zum Entfernen.",
    "actions.tags_required": "Bitte zuerst mindestens ein Tag eingeben.",
    "duplicates.eyebrow": "Duplicate Groups",
    "duplicates.title": "Duplikat-Werkbank",
    "duplicates.subtitle": "Pruefe Duplikate zuerst gruppiert und entscheide dann, welcher Eintrag bleiben soll. Dateien, Links und aehnliche Texte werden hier gebuendelt.",
    "duplicates.filter_all": "Alle",
    "duplicates.filter_asset": "Dateien",
    "duplicates.filter_url": "Links",
    "duplicates.filter_text": "Text",
    "duplicates.summary_groups": "Gruppen",
    "duplicates.summary_items": "Doppelte Inhalte",
    "duplicates.empty_title": "Im Moment gibt es keine Duplikatgruppen zu bearbeiten",
    "duplicates.empty_description": "Sobald doppelte Dateien, Links oder Texte auftauchen, erscheinen sie hier automatisch als Gruppe.",
    "duplicates.recommended": "Empfohlen zu behalten",
    "duplicates.members": "Eintraege in der Gruppe",
    "duplicates.keep_recommended": "Empfohlenen behalten",
    "duplicates.keep_newest": "Neueste behalten",
    "duplicates.keep_oldest": "Aelteste behalten",
    "duplicates.keep_this": "Diesen behalten",
    "duplicates.confirm_cleanup": "Den ausgewaehlten Eintrag behalten und die anderen {count} Duplikate dieser Gruppe loeschen?",
    "duplicates.cleanup_done": "{count} Duplikate entfernt",
    "duplicates.cleanup_empty": "Diese Gruppe hat keine weiteren Duplikate mehr",
    "duplicates.cleanup_failed": "Duplikatbereinigung fehlgeschlagen",
    "duplicates.kind_asset": "Datei-Duplikate",
    "duplicates.kind_url": "Link-Duplikate",
    "duplicates.kind_text": "Text-Duplikate",
    "duplicates.reason_pinned": "Angeheftet",
    "duplicates.reason_favorite": "Favorit",
    "duplicates.reason_shared": "Bereits geteilt",
    "duplicates.reason_active": "Noch aktiv",
    "duplicates.reason_newest": "Neuester",
    "duplicates.latest": "Neueste",
    "duplicates.oldest": "Aelteste",
    "duplicates.group_count": "{count} Eintraege",
    "duplicates.member_assets": "{count} Dateien",
    "duplicates.reasons_label": "Warum empfohlen",
    "duplicates.recommended_mark": "Empfohlen",
    "duplicates.open_home": "Zurueck zum Stream",
    "settings.eyebrow": "Settings",
    "settings.title": "Einstellungen",
    "settings.subtitle": "Das MVP behaelt nur das Nötigste, damit dein persoenliches Tool einfach bleibt.",
    "settings.form_title": "Einstellungen",
    "settings.form_description": "Hier werden nur die wichtigsten Optionen angezeigt, damit alles uebersichtlich bleibt.",
    "settings.app_name": "App-Name",
    "settings.share_base_url": "Basis-URL fuer Freigaben",
    "settings.share_base_url_help": "Erzeugte Freigabelinks verwenden diese Basis-URL.",
    "settings.public_share_base_url": "Oeffentliche Freigabe-URL",
    "settings.public_share_base_url_help": "Externe Freigaben verwenden standardmaessig diese URL.",
    "settings.internal_share_base_url": "Interne Freigabe-URL",
    "settings.internal_share_base_url_help": "Im LAN wird diese URL bevorzugt. Leer lassen, um auf die aktuelle interne Adresse zurueckzufallen.",
    "settings.storage_dir": "Speicherverzeichnis",
    "settings.storage_dir_help": "Dieser Wert kommt aus den Umgebungsvariablen und wird hier nur angezeigt.",
    "settings.save": "Speichern",
    "settings.saving": "Speichert...",
    "settings.saved": "Einstellungen gespeichert",
    "share.title": "Geteilter Inhalt von {appName}",
    "share.description": "Dies ist eine oeffentliche Ansicht mit urspruenglichem Sender und Zeitstempel.",
    "not_found.title": "Inhalt nicht gefunden",
    "not_found.description": "Dieser Link ist eventuell abgelaufen oder der urspruengliche Eintrag wurde entfernt.",
    "not_found.back_home": "Zur Startseite"
  },
  es: {
    "header.settings": "Ajustes",
    "header.language": "Idioma",
    "header.duplicates": "Duplicados",
    "toolbar.stream": "Flujo",
    "toolbar.count": "{count} elementos",
    "toolbar.clear": "Limpiar",
    "toolbar.search": "Buscar",
    "toolbar.collapse": "Ocultar",
    "toolbar.search_placeholder": "Buscar mensajes, archivos, remitentes o dispositivos",
    "toolbar.only_duplicates": "Solo duplicados",
    "toolbar.clear_filters": "Limpiar filtros",
    "toolbar.saved_views": "Vistas guardadas",
    "toolbar.save_view": "Guardar vista",
    "toolbar.save_view_placeholder": "Nombre de esta vista",
    "toolbar.save_view_confirm": "Guardar",
    "toolbar.save_view_cancel": "Cancelar",
    "toolbar.delete_view": "Eliminar vista",
    "toolbar.confirm_delete_view": "¿Eliminar esta vista guardada?",
    "toolbar.save_view_name_required": "Escribe un nombre para esta vista.",
    "toolbar.save_view_failed": "No se pudo guardar esta vista",
    "toolbar.delete_view_failed": "No se pudo eliminar esta vista",
    "toolbar.organize": "Organizar en lote",
    "toolbar.selection_count": "{count} seleccionados",
    "toolbar.select_all_visible": "Seleccionar visibles",
    "toolbar.clear_selection": "Limpiar seleccion",
    "toolbar.exit_selection": "Salir de organizar",
    "toolbar.long_press_hint": "En movil tambien puedes mantener pulsado un elemento para entrar en multi-seleccion.",
    "toolbar.all_tags": "Todas las etiquetas",
    "empty.title": "Este espacio fluye como una conversacion",
    "empty.description": "Envia texto, imagenes, videos, PDF o cualquier archivo desde el compositor inferior y aparecera aqui al instante.",
    "composer.empty_error": "Escribe un mensaje o agrega al menos un archivo.",
    "composer.new_content": "Nuevo contenido",
    "composer.pending_count": "{count} listos para enviar",
    "composer.ready_to_send": "Listo para enviar",
    "composer.instructions": "El texto se envia como un solo mensaje y los archivos se siguen enviando uno por uno. Puedes arrastrar, pegar o elegir archivos.",
    "composer.text_and_files": "Texto y archivos comparten el mismo compositor",
    "composer.shortcut": "Atajo Ctrl/Cmd + Enter",
    "composer.placeholder": "Escribe algo, arrastra unas imagenes o pega una captura...",
    "composer.pending_file": "Archivo en cola",
    "composer.remove": "Quitar",
    "composer.add_files": "Agregar archivos",
    "composer.clear_files": "Limpiar archivos",
    "composer.sending": "Enviando...",
    "composer.send": "Enviar",
    "composer.send_count": "Enviar {count}",
    "composer.open": "Abrir",
    "composer.cta_title": "Enviar notas, archivos y capturas",
    "composer.cta_description": "Abre el compositor flotante y lanza nuevo contenido al flujo",
    "entry.local_source": "Dispositivo local",
    "entry.favorite": "Favorito",
    "entry.archived": "Archivado",
    "entry.pinned": "Fijado",
    "entry.duplicate": "{count} duplicados",
    "entry.share_revoked": "Compartido revocado",
    "entry.open": "Abrir",
    "entry.download": "Descargar",
    "entry.open_new_window": "Abrir en otra ventana",
    "search.matches": "Coincidencias",
    "search.source_message": "Mensaje",
    "search.source_asset_name": "Nombre del archivo",
    "search.source_asset_text": "Texto del archivo",
    "search.source_sender": "Remitente",
    "actions.processing": "Procesando...",
    "actions.copy_share": "Copiar enlace",
    "actions.copy_text": "Copiar texto",
    "actions.copy_image": "Copiar imagen",
    "actions.more": "Mas acciones",
    "actions.generate_share": "Generar enlace",
    "actions.revoke_share": "Revocar enlace",
    "actions.revoking": "Revocando...",
    "actions.delete": "Eliminar",
    "actions.deleting": "Eliminando...",
    "actions.confirm_delete": "Eliminar este contenido? Los archivos adjuntos tambien se eliminaran.",
    "actions.share_copied": "Enlace copiado",
    "actions.share_generated": "Enlace generado",
    "actions.share_failed": "Error al compartir",
    "actions.share_revoked": "Compartido revocado",
    "actions.revoke_failed": "Error al revocar",
    "actions.deleted": "Contenido eliminado",
    "actions.delete_failed": "Error al eliminar",
    "actions.copy_prompt": "Copia este enlace",
    "actions.copy_failed": "Error al copiar",
    "actions.copy_preferred_share": "Copiar recomendado",
    "actions.copy_public_share": "Enlace publico",
    "actions.copy_internal_share": "Enlace interno",
    "actions.text_copied": "Texto copiado",
    "actions.image_copied": "Imagen copiada",
    "actions.favorite": "Anadir a favoritos",
    "actions.unfavorite": "Quitar de favoritos",
    "actions.pin": "Fijar",
    "actions.unpin": "Quitar fijado",
    "actions.archive": "Archivar",
    "actions.unarchive": "Quitar del archivo",
    "actions.cleanup_duplicates": "Limpiar otros duplicados",
    "actions.favorite_added": "Anadido a favoritos",
    "actions.favorite_removed": "Quitado de favoritos",
    "actions.favorite_failed": "No se pudo actualizar favoritos",
    "actions.pinned": "Fijado",
    "actions.unpinned": "Fijado quitado",
    "actions.pin_failed": "No se pudo actualizar el fijado",
    "actions.archived": "Archivado",
    "actions.unarchived": "Devuelto al flujo activo",
    "actions.archive_failed": "No se pudo actualizar el archivo",
    "actions.cleanup_duplicates_done": "Se limpiaron {count} duplicados",
    "actions.cleanup_duplicates_empty": "No hay otros duplicados para limpiar",
    "actions.cleanup_duplicates_failed": "No se pudieron limpiar los duplicados",
    "actions.confirm_cleanup_duplicates": "¿Conservar este contenido y eliminar los otros duplicados?",
    "actions.preferred_share_copied": "Enlace recomendado copiado",
    "actions.public_share_copied": "Enlace publico copiado",
    "actions.internal_share_copied": "Enlace interno copiado",
    "actions.public_share_unavailable": "La URL publica no esta disponible",
    "actions.internal_share_unavailable": "La URL interna no esta disponible",
    "actions.select_item": "Seleccionar este elemento",
    "actions.deselect_item": "Quitar este elemento de la seleccion",
    "actions.batch_empty": "Selecciona al menos un elemento primero.",
    "actions.batch_failed": "La accion en lote fallo",
    "actions.confirm_batch_delete": "¿Eliminar los {count} elementos seleccionados? Los archivos adjuntos tambien se eliminaran.",
    "actions.batch_pinned": "Se fijaron {count} elementos",
    "actions.batch_unpinned": "Se quitaron {count} fijados",
    "actions.batch_favorited": "Se anadieron {count} elementos a favoritos",
    "actions.batch_unfavorited": "Se quitaron {count} elementos de favoritos",
    "actions.batch_archived": "Se archivaron {count} elementos",
    "actions.batch_unarchived": "Se devolvieron {count} elementos al flujo activo",
    "actions.batch_deleted": "Se eliminaron {count} elementos",
    "actions.batch_add_tags": "Anadir etiquetas",
    "actions.batch_tags_added": "Se aplicaron etiquetas a {count} elementos",
    "actions.edit_tags": "Editar etiquetas",
    "actions.tags_placeholder": "Escribe etiquetas separadas por comas o saltos de linea",
    "actions.save_tags": "Guardar etiquetas",
    "actions.clear_tags": "Limpiar etiquetas",
    "actions.tags_saved": "Etiquetas guardadas",
    "actions.tags_cleared": "Etiquetas eliminadas",
    "actions.tags_failed": "No se pudieron actualizar las etiquetas",
    "actions.tags_empty": "No hay etiquetas para limpiar.",
    "actions.tags_required": "Escribe al menos una etiqueta primero.",
    "duplicates.eyebrow": "Duplicate Groups",
    "duplicates.title": "Mesa de duplicados",
    "duplicates.subtitle": "Primero revisa los duplicados por grupo y luego decide cual conservar. Aqui se juntan archivos, enlaces y textos repetidos.",
    "duplicates.filter_all": "Todo",
    "duplicates.filter_asset": "Archivos",
    "duplicates.filter_url": "Enlaces",
    "duplicates.filter_text": "Texto",
    "duplicates.summary_groups": "Grupos",
    "duplicates.summary_items": "Elementos duplicados",
    "duplicates.empty_title": "Todavia no hay grupos duplicados para procesar",
    "duplicates.empty_description": "Cuando aparezcan archivos, enlaces o textos duplicados, se agruparan aqui automaticamente.",
    "duplicates.recommended": "Recomendado conservar",
    "duplicates.members": "Elementos del grupo",
    "duplicates.keep_recommended": "Conservar recomendado",
    "duplicates.keep_newest": "Conservar mas reciente",
    "duplicates.keep_oldest": "Conservar mas antiguo",
    "duplicates.keep_this": "Conservar este",
    "duplicates.confirm_cleanup": "¿Conservar el elemento seleccionado y eliminar los otros {count} duplicados de este grupo?",
    "duplicates.cleanup_done": "Se eliminaron {count} duplicados",
    "duplicates.cleanup_empty": "Este grupo ya no tiene otros duplicados",
    "duplicates.cleanup_failed": "La limpieza de duplicados fallo",
    "duplicates.kind_asset": "Duplicados de archivos",
    "duplicates.kind_url": "Duplicados de enlaces",
    "duplicates.kind_text": "Duplicados de texto",
    "duplicates.reason_pinned": "Fijado",
    "duplicates.reason_favorite": "Favorito",
    "duplicates.reason_shared": "Ya compartido",
    "duplicates.reason_active": "Sigue activo",
    "duplicates.reason_newest": "Mas reciente",
    "duplicates.latest": "Mas reciente",
    "duplicates.oldest": "Mas antiguo",
    "duplicates.group_count": "{count} elementos",
    "duplicates.member_assets": "{count} archivos",
    "duplicates.reasons_label": "Por que se recomienda",
    "duplicates.recommended_mark": "Recomendado",
    "duplicates.open_home": "Volver al flujo",
    "settings.eyebrow": "Settings",
    "settings.title": "Ajustes",
    "settings.subtitle": "El MVP solo conserva lo esencial para que tu herramienta personal siga siendo simple.",
    "settings.form_title": "Ajustes",
    "settings.form_description": "Aqui solo se muestran las opciones necesarias para mantener la experiencia sencilla.",
    "settings.app_name": "Nombre de la app",
    "settings.share_base_url": "URL base de compartido",
    "settings.share_base_url_help": "Los enlaces generados usaran esta URL base.",
    "settings.public_share_base_url": "URL publica de compartido",
    "settings.public_share_base_url_help": "Las comparticiones externas usan esta URL por defecto.",
    "settings.internal_share_base_url": "URL interna de compartido",
    "settings.internal_share_base_url_help": "En LAN se prioriza esta URL. Si queda vacia, se reutiliza la direccion interna actual.",
    "settings.storage_dir": "Directorio de almacenamiento",
    "settings.storage_dir_help": "Este valor proviene de variables de entorno y se muestra aqui como referencia.",
    "settings.save": "Guardar ajustes",
    "settings.saving": "Guardando...",
    "settings.saved": "Ajustes guardados",
    "share.title": "Contenido compartido de {appName}",
    "share.description": "Esta es una vista publica y conserva el remitente y la hora originales.",
    "not_found.title": "Contenido no encontrado",
    "not_found.description": "Es posible que este enlace haya expirado o que el contenido original se haya eliminado.",
    "not_found.back_home": "Volver al inicio"
  }
};

const entryTypeLabelsByLocale: Record<AppLocale, Record<EntryType | "ALL", string>> = {
  "zh-CN": {
    ALL: "全部",
    TEXT: "文本",
    IMAGE: "图片",
    VIDEO: "视频",
    PDF: "PDF",
    FILE: "文件",
    MIXED: "混合"
  },
  en: {
    ALL: "All",
    TEXT: "Text",
    IMAGE: "Images",
    VIDEO: "Videos",
    PDF: "PDF",
    FILE: "Files",
    MIXED: "Mixed"
  },
  ja: {
    ALL: "すべて",
    TEXT: "テキスト",
    IMAGE: "画像",
    VIDEO: "動画",
    PDF: "PDF",
    FILE: "ファイル",
    MIXED: "複合"
  },
  fr: {
    ALL: "Tout",
    TEXT: "Texte",
    IMAGE: "Images",
    VIDEO: "Videos",
    PDF: "PDF",
    FILE: "Fichiers",
    MIXED: "Mixte"
  },
  de: {
    ALL: "Alle",
    TEXT: "Text",
    IMAGE: "Bilder",
    VIDEO: "Videos",
    PDF: "PDF",
    FILE: "Dateien",
    MIXED: "Gemischt"
  },
  es: {
    ALL: "Todo",
    TEXT: "Texto",
    IMAGE: "Imagenes",
    VIDEO: "Videos",
    PDF: "PDF",
    FILE: "Archivos",
    MIXED: "Mixto"
  }
};

const entryViewLabelsByLocale: Record<AppLocale, Record<EntryView, string>> = {
  "zh-CN": {
    ACTIVE: "进行中",
    FAVORITES: "收藏",
    ARCHIVED: "已归档",
    ALL: "全部"
  },
  en: {
    ACTIVE: "Active",
    FAVORITES: "Favorites",
    ARCHIVED: "Archived",
    ALL: "All"
  },
  ja: {
    ACTIVE: "進行中",
    FAVORITES: "お気に入り",
    ARCHIVED: "アーカイブ",
    ALL: "すべて"
  },
  fr: {
    ACTIVE: "Actifs",
    FAVORITES: "Favoris",
    ARCHIVED: "Archives",
    ALL: "Tout"
  },
  de: {
    ACTIVE: "Aktiv",
    FAVORITES: "Favoriten",
    ARCHIVED: "Archiviert",
    ALL: "Alle"
  },
  es: {
    ACTIVE: "Activos",
    FAVORITES: "Favoritos",
    ARCHIVED: "Archivados",
    ALL: "Todo"
  }
};

export function resolveLocale(input?: string | null): AppLocale {
  if (!input) {
    return "zh-CN";
  }

  const normalized = input.trim().toLowerCase();
  const exact = supportedLocales.find((locale) => locale.toLowerCase() === normalized);

  if (exact) {
    return exact;
  }

  const language = normalized.split("-")[0];

  switch (language) {
    case "zh":
      return "zh-CN";
    case "en":
      return "en";
    case "ja":
      return "ja";
    case "fr":
      return "fr";
    case "de":
      return "de";
    case "es":
      return "es";
    default:
      return "zh-CN";
  }
}

export function matchLocaleFromAcceptLanguage(value?: string | null): AppLocale {
  if (!value) {
    return "zh-CN";
  }

  const candidates = value.split(",").map((item) => item.split(";")[0]?.trim());

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    const normalized = candidate.toLowerCase();
    const exact = supportedLocales.find((locale) => locale.toLowerCase() === normalized);

    if (exact) {
      return exact;
    }

    const language = normalized.split("-")[0];

    if (language === "zh") return "zh-CN";
    if (language === "en") return "en";
    if (language === "ja") return "ja";
    if (language === "fr") return "fr";
    if (language === "de") return "de";
    if (language === "es") return "es";
  }

  return "zh-CN";
}

export function getMessages(locale: AppLocale): Messages {
  return messagesByLocale[locale] || messagesByLocale["zh-CN"];
}

export function getEntryTypeLabels(locale: AppLocale): Record<EntryType | "ALL", string> {
  return entryTypeLabelsByLocale[locale] || entryTypeLabelsByLocale["zh-CN"];
}

export function getEntryViewLabels(locale: AppLocale): Record<EntryView, string> {
  return entryViewLabelsByLocale[locale] || entryViewLabelsByLocale["zh-CN"];
}

export function t(
  locale: AppLocale,
  key: MessageKey,
  params?: Record<string, string | number>
): string {
  return interpolate(
    getMessages(locale)[key] || messagesByLocale.en[key] || messagesByLocale["zh-CN"][key] || key,
    params
  );
}

export function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce((output, [key, value]) => {
    return output.replaceAll(`{${key}}`, String(value));
  }, template);
}
