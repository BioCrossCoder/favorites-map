<script lang="ts" setup>
import LayoutMain from '@/components/LayoutMain.vue';
import { createGraphConfig } from '@/composables/config';
import { useGraphPositionStore, useFavoritesMapStore, useSelectedTagsStore } from '@/composables/store';
import { buildGraphEdges, buildGraphNodes, handleMouseEnter, handleMouseLeave } from '@/composables/utils';
import { Action, FavoritesMapData, ImportRequest, TFavoritesMapData } from '@/interface';
import { Download, Upload, Star, StarFilled } from '@element-plus/icons-vue';
import { genFileId, UploadFile, UploadInstance, UploadRawFile } from 'element-plus';
import { isRight } from 'fp-ts/lib/Either';
import * as vNG from 'v-network-graph';
import { useRouter } from 'vue-router';

// Load data and init states
const store = useFavoritesMapStore();
const selectedTags = useSelectedTagsStore().getState();
const nodeData = store.filterNodes(selectedTags);
const position = useGraphPositionStore();
const configs = computed(() => {
    nodeData.value; // trigger re-render when data changes
    return createGraphConfig(position.value);
});
const selectedNodes = computed(() => position.value ? [position.value] : []);
const hoverNode = ref('');
const hintText = computed(() => hoverNode.value || position.value);

// Build graph
const view = computed(() => {
    if (position.value) {
        const center = store.selectNode(position.value);
        if (center) {
            return center.relatedNodes.concat(center.url).map((node: string) => store.selectNode(node)!);
        }
    }
    return nodeData.value;
});
const count = computed<number>(() => view.value.length);
const nodes = buildGraphNodes(view);
const edges = buildGraphEdges(view);
const eventHandlers: vNG.EventHandlers = {
    'node:click': ({ node }) => {
        position.set(node);
    },
    'node:pointerover': ({ node }) => {
        handleMouseEnter(store.selectNode(node)!.name, hoverNode);
    },
    'node:pointerout': () => {
        handleMouseLeave(hoverNode)
    },
}
const graph = ref<vNG.Instance>();
onMounted(() => {
    const observer = watch(graph, () => {
        if (graph.value) {
            watch(view, graph.value.panToCenter);
            observer.stop();
        }
    })
});

function handleClickVisit() {
    if (!position.value) {
        alert('No Target Node Selected')
    } else {
        browser.tabs.update({ url: position.value });
    }
}
function handleMouseLeaveHover() {
    handleMouseLeave(hoverNode);
}
const upload = ref<UploadInstance>();
function handleExceed(files: File[]) {
    upload.value!.clearFiles();
    const file = files[0] as UploadRawFile;
    file.uid = genFileId();
    upload.value!.handleStart(file);
}
function handleUploadSuccess(_response: any, uploadFile: UploadFile) {
    setTimeout(() => {
        uploadFail.value = false;
    }, 0);
    if (uploadFail.value) {
        return
    }
    uploadFile.raw!.text().then((content: string) => {
        const message: ImportRequest = {
            action: Action.Import,
            data: JSON.parse(content) as FavoritesMapData
        }
        browser.runtime.sendMessage(message);
    });
}
const uploadFail = ref(false);
function handleBeforeUpload(rawFile: UploadRawFile) {
    rawFile.text().then((content: string) => {
        try {
            if (!isRight(TFavoritesMapData.decode(JSON.parse(content)))) {
                throw Error('invalid data format in file contents.');
            }
            uploadFail.value = false;
        } catch (err) {
            uploadFail.value = true;
            alert(err);
        }
    });
}
function handleMouseEnterUpload() {
    handleMouseEnter('Import', hoverNode);
}
function handleClickDownload() {
    const keyword = ref('');
    const data: FavoritesMapData = {
        nodes: store.searchNodes(keyword).value,
        tags: store.searchTags(keyword).value,
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'text/json' });
    const url = URL.createObjectURL(blob);
    browser.downloads.download({
        url: url,
        filename: 'favorites-map-data.json',
        conflictAction: 'uniquify'
    }).then(() => {
        URL.revokeObjectURL(url);
    });
}
function handleMouseEnterDownload() {
    handleMouseEnter('Export', hoverNode);
}
const hoverStar = ref(false);
const router = useRouter();
function handleMouseEnterStar() {
    hoverStar.value = true;
    handleMouseEnter('Migrate from Favorites', hoverNode);
}
function handleMouseLeaveStar() {
    hoverStar.value = false;
    handleMouseLeaveHover();
}
</script>

<template>
    <el-container class="container">
        <el-header class="header">
            <el-row justify="space-between" align="middle" class="row">
                <el-col :span="12">
                    <el-button type="primary" @click="handleClickVisit">Visit</el-button>
                    <el-button @click="() => position.set('')">Overview</el-button>
                </el-col>
                <el-col :span="6">
                    <el-tag>{{ count }}</el-tag>
                </el-col>
                <el-col :span="5.5">
                    <el-upload ref="upload" class="upload" :limit="1" :on-exceed="handleExceed" :show-file-list="false"
                        :on-success="handleUploadSuccess" :before-upload="handleBeforeUpload">
                        <el-icon size="20" class="icon" @mouseenter="handleMouseEnterUpload"
                            @mouseleave="handleMouseLeaveHover">
                            <Upload />
                        </el-icon>
                    </el-upload>
                    <el-icon size="20" class="icon" @click="handleClickDownload" @mouseenter="handleMouseEnterDownload"
                        @mouseleave="handleMouseLeaveHover">
                        <Download />
                    </el-icon>
                    <el-icon size="20" class="icon" @click="() => router.push({ path: '/import' })"
                        @mouseenter="handleMouseEnterStar" @mouseleave="handleMouseLeaveStar">
                        <StarFilled v-if="hoverStar" />
                        <Star v-else />
                    </el-icon>
                </el-col>
            </el-row>
            <el-row>
                <el-tag size="large" class="tag">{{ hintText }}</el-tag>
            </el-row>
        </el-header>
        <LayoutMain>
            <v-network-graph id="graph" :nodes="nodes" :edges="edges" :selectedNodes="selectedNodes" :configs="configs"
                :event-handlers="eventHandlers" ref="graph" />
        </LayoutMain>
    </el-container>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/common.scss";

.container {
    @extend %fill-container;
}

$header-height: 2*common.$bar-height;

.header {
    @include common.block-with-height($header-height);
}

.row {
    height: common.$bar-height;
}

#graph {
    $min-side-length: 300px;
    height: max($min-side-length, calc(100% - 4*common.$border-width));
    width: max($min-side-length, calc(100% - 2*common.$border-width));
    border: common.$border-width solid common.$theme-blue;
}

.tag {
    @extend %graph-tag;
    display: inline-block;
    text-align: center;
    align-content: center;
    white-space: normal;
    word-break: break-all;
}

.upload {
    display: inline-flex;
}

.icon {
    @include common.icon(0.8*common.$bar-height);
}
</style>