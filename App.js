
import React,{useEffect,useRef,useState} from "react";
import {Alert,Dimensions,FlatList,Modal,Pressable,SafeAreaView,ScrollView,StyleSheet,Switch,Text,TextInput,View} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import * as IntentLauncher from "expo-intent-launcher";
import {SaveFormat} from "expo-image-manipulator";
import {captureRef} from "react-native-view-shot";
import {StatusBar} from "expo-status-bar";

const SIZE=Math.min(Dimensions.get("window").width-28,390);
const EMOJIS=["😀","😂","🤣","😭","😎","😡","🤡","💀","☠️","😳","😱","🤨","😐","🙄","😴","🤔","🗿","🐱","🐶","🤓","🥶","🥵","😈","👽","🤖","🔥","💯","👍","👎","❤️","✨","🎉"];
const KEY="@reyadan_sticker_pack";
const DEFAULT={packName:"Sticker ReYadan",publisher:"ReYadan",bgMode:"transparent",bgColor:"#FFFFFF",text:"",size:62,textColor:"#111111",strokeColor:"#FFFFFF",stroke:13,showStroke:true,emoji:"😭",showEmoji:true,emojiX:256,emojiY:150,textX:256,textY:350,stickers:[]};

async function writeNativeMetadata(state){
 const dir=FileSystem.documentDirectory+"stickers/";
 await FileSystem.makeDirectoryAsync(dir,{intermediates:true});
 const lines=[`name=${String(state.packName||"Sticker ReYadan").replace(/[\r\n|]/g," ")}`,`publisher=${String(state.publisher||"ReYadan").replace(/[\r\n|]/g," ")}`];
 for(const item of state.stickers||[]){
  lines.push(`sticker=${item.file}|${String(item.emoji||"😀").replace(/[\r\n|]/g," ")}|${String(item.text||"Sticker").replace(/[\r\n|]/g," ")}`);
 }
 await FileSystem.writeAsStringAsync(dir+"metadata.txt",lines.join("\n"));
}

export default function App(){
 const [s,setS]=useState(DEFAULT),[tab,setTab]=useState("create"),[emojiModal,setEmojiModal]=useState(false),[bgModal,setBgModal]=useState(false),[packModal,setPackModal]=useState(false);
 const preview=useRef(null);
 useEffect(()=>{AsyncStorage.getItem(KEY).then(x=>x&&setS({...DEFAULT,...JSON.parse(x)})).catch(()=>{})},[]);
 useEffect(()=>{AsyncStorage.setItem(KEY,JSON.stringify(s)).catch(()=>{}); writeNativeMetadata(s).catch(()=>{})},[s]);
 const set=(k,v)=>setS(x=>({...x,[k]:v}));
 const move=(kind,dx,dy)=>setS(x=>({...x,[kind+"X"]:Math.max(35,Math.min(477,x[kind+"X"]+dx)),[kind+"Y"]:Math.max(35,Math.min(477,x[kind+"Y"]+dy))}));

 const saveSticker=async()=>{
  if(!s.text.trim()&&!s.showEmoji)return Alert.alert("Sticker kosong","Tambahkan emoji atau teks dulu.");
  if(s.stickers.length>=30)return Alert.alert("Paket penuh","Maksimal 30 sticker.");
  try{
   const png=await captureRef(preview.current,{format:"png",width:512,height:512,quality:1,result:"tmpfile"});
   const webp=await ImageManipulator.manipulateAsync(png,[],{format:SaveFormat.WEBP,compress:.88});
   const dir=FileSystem.documentDirectory+"stickers/";
   await FileSystem.makeDirectoryAsync(dir,{intermediates:true});
   const id=String(Date.now()),dest=dir+id+".webp";
   await FileSystem.copyAsync({from:webp.uri,to:dest});
   setS(x=>({...x,stickers:[...x.stickers,{id,file:id+".webp",uri:dest,emoji:x.emoji,text:x.text.slice(0,125)}]}));
   await writeNativeMetadata({...s, stickers:[...s.stickers,{id,file:id+".webp",uri:dest,emoji:s.emoji,text:s.text.slice(0,125)}]});
   setTab("pack"); Alert.alert("Berhasil 🎉","Sticker masuk ke paket.");
  }catch(e){Alert.alert("Gagal",String(e?.message||e))}
 };

 const addWhatsApp=async()=>{
  if(s.stickers.length<3)return Alert.alert("Belum cukup","Paket WhatsApp membutuhkan minimal 3 sticker.");
  try{
   await writeNativeMetadata(s);
   await IntentLauncher.startActivityAsync("com.whatsapp.intent.action.ENABLE_STICKER_PACK",{
    extra:{
     sticker_pack_id:"reyadan_pack",
     sticker_pack_authority:"com.reyadan.stikermaker.stickercontentprovider",
     sticker_pack_name:s.packName
    }
   });
  }catch(e){
   Alert.alert("WhatsApp tidak tersedia", "Pastikan WhatsApp terpasang. Jika sudah terpasang, coba lagi setelah membuka aplikasi sekali.");
  }
 };

 const previewNode=<View ref={preview} collapsable={false} style={[styles.canvas,s.bgMode==="color"?{backgroundColor:s.bgColor}:{backgroundColor:"transparent"}]}>
  {s.showEmoji&&<Drag kind="emoji" x={s.emojiX} y={s.emojiY} move={move}><Text style={styles.emoji}>{s.emoji}</Text></Drag>}
  {s.text.trim()&&<Drag kind="text" x={s.textX} y={s.textY} move={move}><Text style={{fontSize:s.size,fontWeight:"900",color:s.textColor,textAlign:"center",maxWidth:460,textShadowColor:s.showStroke?s.strokeColor:"transparent",textShadowRadius:s.showStroke?s.stroke:0,textShadowOffset:{width:0,height:0}}}>{s.text}</Text></Drag>}
 </View>;

 return <SafeAreaView style={styles.safe}>
  <StatusBar style="light"/>
  <View style={styles.header}><View><Text style={styles.brand}>ReYadan</Text><Text style={styles.sub}>STIKER MAKER</Text></View><Pressable style={styles.pill} onPress={()=>setPackModal(true)}><Text style={styles.pillText}>📦 {s.packName}</Text></Pressable></View>
  <View style={styles.tabs}><Tab active={tab==="create"} text="✨ Buat" onPress={()=>setTab("create")}/><Tab active={tab==="pack"} text={"📦 Paket ("+s.stickers.length+")"} onPress={()=>setTab("pack")}/></View>

  {tab==="create"?<ScrollView contentContainerStyle={styles.content}>
   <View style={styles.previewCard}><View style={styles.previewOuter}>{previewNode}</View><Text style={styles.hint}>Geser emoji atau teks langsung di preview</Text></View>
   <Section title="Emoji"><Pressable style={styles.selector} onPress={()=>setEmojiModal(true)}><Text style={styles.selectorEmoji}>{s.emoji}</Text><Text style={styles.selectorText}>Pilih emoji</Text><Text style={styles.chev}>›</Text></Pressable><View style={styles.rowBox}><Text style={styles.label}>Tampilkan emoji</Text><Switch value={s.showEmoji} onValueChange={v=>set("showEmoji",v)} trackColor={{false:"#303746",true:"#16B364"}}/></View></Section>
   <Section title="Teks"><TextInput value={s.text} onChangeText={v=>set("text",v)} placeholder="Contoh: saya akan lawan 😭" placeholderTextColor="#667085" style={styles.input} multiline maxLength={70}/>
    <View style={styles.two}><Box title="Ukuran"><Stepper value={s.size} min={28} max={100} step={2} set={v=>set("size",v)} suffix=" px"/></Box><Box title="Outline"><Switch value={s.showStroke} onValueChange={v=>set("showStroke",v)} trackColor={{false:"#303746",true:"#16B364"}}/></Box></View>
    <View style={styles.two}><Box title="Warna teks"><Colors value={s.textColor} set={v=>set("textColor",v)}/></Box><Box title="Warna outline"><Colors value={s.strokeColor} set={v=>set("strokeColor",v)}/></Box></View>
    {s.showStroke&&<Box title="Ketebalan outline"><Stepper value={s.stroke} min={0} max={28} step={1} set={v=>set("stroke",v)} suffix=" px"/></Box>}
   </Section>
   <Section title="Background"><Pressable style={styles.selector} onPress={()=>setBgModal(true)}><View style={[styles.dot,{backgroundColor:s.bgMode==="transparent"?"#111827":s.bgColor}]}/><Text style={styles.selectorText}>{s.bgMode==="transparent"?"Transparan":s.bgColor}</Text><Text style={styles.chev}>›</Text></Pressable></Section>
   <Pressable style={styles.primary} onPress={saveSticker}><Text style={styles.primaryText}>＋ Simpan Sticker ke Paket</Text></Pressable>
   <Pressable style={styles.whatsapp} onPress={()=>setTab("pack")}><Text style={styles.whatsappText}>🟢 Lihat Paket & WhatsApp</Text></Pressable>
  </ScrollView>:
  <View style={{flex:1}}><View style={styles.packHero}><View style={styles.packIcon}><Text style={{fontSize:28}}>🧩</Text></View><View style={{flex:1}}><Text style={styles.packName}>{s.packName}</Text><Text style={styles.small}>{s.publisher} • {s.stickers.length}/30 sticker</Text></View><Pressable onPress={()=>setPackModal(true)}><Text style={styles.edit}>Edit</Text></Pressable></View>
   <FlatList data={s.stickers} numColumns={3} keyExtractor={x=>x.id} contentContainerStyle={styles.grid} ListEmptyComponent={<Text style={styles.empty}>Belum ada sticker ✨</Text>} renderItem={({item})=><View style={styles.card}><View style={styles.thumb}><Text style={{fontSize:40}}>{item.emoji}</Text><Text style={styles.thumbText} numberOfLines={2}>{item.text}</Text></View><Pressable onPress={()=>setS(x=>({...x,stickers:x.stickers.filter(y=>y.id!==item.id)}))}><Text style={styles.delete}>Hapus</Text></Pressable></View>}/>
   <View style={styles.bottom}><Pressable style={[styles.whatsapp,{opacity:s.stickers.length>=3?1:.5}]} onPress={addWhatsApp}><Text style={styles.whatsappText}>🟢 Tambahkan Paket ke WhatsApp</Text></Pressable><Text style={styles.center}>Minimal 3 • maksimal 30 sticker</Text></View>
  </View>}

  <Modal visible={emojiModal} transparent animationType="slide"><View style={styles.shade}><View style={styles.sheet}><Text style={styles.title}>Pilih Emoji</Text><View style={styles.emojiGrid}>{EMOJIS.map(e=><Pressable key={e} style={styles.emojiBtn} onPress={()=>{set("emoji",e);set("showEmoji",true);setEmojiModal(false)}}><Text style={{fontSize:28}}>{e}</Text></Pressable>)}</View><Close onPress={()=>setEmojiModal(false)}/></View></View></Modal>
  <Modal visible={bgModal} transparent animationType="slide"><View style={styles.shade}><View style={styles.sheet}><Text style={styles.title}>Background</Text><View style={styles.bgGrid}>{["#FFFFFF","#000000","#25D366","#60A5FA","#F59E0B","#F472B6","#A78BFA","#EF4444"].map(c=><Pressable key={c} style={[styles.bgChoice,{backgroundColor:c}]} onPress={()=>{set("bgMode","color");set("bgColor",c);setBgModal(false)}}><Text style={{color:c==="#000000"?"#fff":"#111"}}>A</Text></Pressable>)}</View><Pressable style={styles.selector} onPress={()=>{set("bgMode","transparent");setBgModal(false)}}><Text style={styles.label}>◻ Transparan</Text></Pressable><Close onPress={()=>setBgModal(false)}/></View></View></Modal>
  <Modal visible={packModal} transparent animationType="slide"><View style={styles.shade}><View style={styles.sheet}><Text style={styles.title}>Nama Paket Sticker</Text><Text style={styles.small}>Nama paket (bisa diedit)</Text><TextInput value={s.packName} onChangeText={v=>set("packName",v)} style={styles.input} maxLength={128} placeholder="Sticker ReYadan" placeholderTextColor="#667085"/><Text style={styles.small}>Pembuat</Text><TextInput value={s.publisher} onChangeText={v=>set("publisher",v)} style={styles.input} maxLength={128}/><Close text="Simpan" onPress={()=>setPackModal(false)}/></View></View></Modal>
 </SafeAreaView>
}

function Drag({kind,x,y,move,children}){const last=useRef(null);return <Pressable style={{position:"absolute",left:x-100,top:y-60,width:200,minHeight:100,alignItems:"center",justifyContent:"center"}} onTouchStart={e=>last.current=e.nativeEvent} onTouchMove={e=>{if(!last.current)return;const p=e.nativeEvent;move(kind,(p.pageX-last.current.pageX)*512/SIZE,(p.pageY-last.current.pageY)*512/SIZE);last.current=p}}>{children}</Pressable>}
function Tab({active,text,onPress}){return <Pressable onPress={onPress} style={[styles.tab,active&&styles.tabOn]}><Text style={[styles.tabText,active&&styles.tabTextOn]}>{text}</Text></Pressable>}
function Section({title,children}){return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>}
function Box({title,children}){return <View style={styles.box}><Text style={styles.small}>{title}</Text>{children}</View>}
function Stepper({value,min,max,step,set,suffix}){return <View style={styles.stepper}><Pressable onPress={()=>set(Math.max(min,value-step))}><Text style={styles.step}>−</Text></Pressable><Text style={styles.stepValue}>{value}{suffix}</Text><Pressable onPress={()=>set(Math.min(max,value+step))}><Text style={styles.step}>＋</Text></Pressable></View>}
function Colors({value,set}){return <ScrollView horizontal showsHorizontalScrollIndicator={false}>{["#111111","#FFFFFF","#25D366","#F59E0B","#EF4444","#60A5FA","#A78BFA","#F472B6"].map(c=><Pressable key={c} onPress={()=>set(c)} style={[styles.color,{backgroundColor:c,borderColor:value===c?"#25D366":"#374151"}]}/>)}</ScrollView>}
function Close({onPress,text="Tutup"}){return <Pressable style={styles.close} onPress={onPress}><Text style={styles.closeText}>{text}</Text></Pressable>}

const styles=StyleSheet.create({
safe:{flex:1,backgroundColor:"#070A0F"},header:{padding:16,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},brand:{fontSize:25,fontWeight:"900",color:"#fff"},sub:{fontSize:10,fontWeight:"900",color:"#25D366",letterSpacing:2},pill:{maxWidth:175,padding:9,borderRadius:18,borderWidth:1,borderColor:"#273043",backgroundColor:"#111722"},pillText:{fontSize:11,fontWeight:"800",color:"#D8DEE9"},tabs:{marginHorizontal:14,padding:4,borderRadius:14,flexDirection:"row",backgroundColor:"#0F141D"},tab:{flex:1,padding:11,borderRadius:11,alignItems:"center"},tabOn:{backgroundColor:"#183226"},tabText:{fontWeight:"800",color:"#7E8A9F"},tabTextOn:{color:"#25D366"},content:{padding:14,paddingBottom:40},previewCard:{padding:10,borderRadius:22,borderWidth:1,borderColor:"#222B3A",backgroundColor:"#101620"},previewOuter:{width:SIZE,height:SIZE,borderRadius:16,overflow:"hidden",backgroundColor:"#F3F4F6"},canvas:{width:512,height:512,transform:[{scale:SIZE/512}],position:"absolute",left:0,top:0},hint:{textAlign:"center",color:"#6F7B90",fontSize:10,paddingTop:8},emoji:{fontSize:150},section:{marginTop:15},sectionTitle:{fontSize:11,fontWeight:"900",letterSpacing:1,color:"#9BA7B9",marginBottom:8},selector:{minHeight:48,padding:11,borderRadius:14,borderWidth:1,borderColor:"#273043",backgroundColor:"#0F151F",flexDirection:"row",alignItems:"center"},selectorEmoji:{fontSize:29,marginRight:10},selectorText:{flex:1,color:"#E8EDF5",fontWeight:"700"},chev:{fontSize:24,color:"#738098"},rowBox:{marginTop:8,padding:12,borderRadius:13,backgroundColor:"#0F151F",flexDirection:"row",alignItems:"center",justifyContent:"space-between"},label:{color:"#E7ECF4",fontSize:13,fontWeight:"700"},input:{marginBottom:9,padding:12,minHeight:46,borderRadius:13,borderWidth:1,borderColor:"#273043",backgroundColor:"#0B1018",color:"#fff",textAlignVertical:"top"},two:{flexDirection:"row",gap:9,marginTop:9},box:{flex:1,padding:10,borderRadius:13,backgroundColor:"#0F151F",minHeight:62},small:{fontSize:10,color:"#748197",marginBottom:6},stepper:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},step:{fontSize:22,fontWeight:"800",color:"#25D366"},stepValue:{fontWeight:"800",color:"#fff"},color:{width:26,height:26,borderRadius:13,borderWidth:2,marginRight:8},dot:{width:30,height:30,borderRadius:15,borderWidth:1,borderColor:"#374151",marginRight:10},primary:{marginTop:16,padding:14,borderRadius:15,alignItems:"center",backgroundColor:"#25D366"},primaryText:{fontSize:14,fontWeight:"900",color:"#03170B"},whatsapp:{marginTop:9,padding:14,borderRadius:15,alignItems:"center",backgroundColor:"#138A5A"},whatsappText:{fontSize:13,fontWeight:"900",color:"#fff"},packHero:{margin:14,padding:14,borderRadius:18,borderWidth:1,borderColor:"#273043",backgroundColor:"#101620",flexDirection:"row",alignItems:"center"},packIcon:{width:52,height:52,borderRadius:16,backgroundColor:"#183226",alignItems:"center",justifyContent:"center",marginRight:11},packName:{fontSize:16,fontWeight:"900",color:"#fff"},edit:{fontWeight:"800",color:"#25D366"},grid:{padding:10,paddingBottom:130},card:{width:"31%",margin:"1.16%",padding:7,borderRadius:14,borderWidth:1,borderColor:"#273043",backgroundColor:"#101620"},thumb:{aspectRatio:1,borderRadius:10,backgroundColor:"#F3F4F6",alignItems:"center",justifyContent:"center",overflow:"hidden"},thumbText:{fontSize:10,fontWeight:"900",textAlign:"center",color:"#111"},delete:{paddingTop:5,textAlign:"center",fontSize:10,fontWeight:"800",color:"#F87171"},empty:{padding:40,textAlign:"center",color:"#667085"},bottom:{position:"absolute",left:14,right:14,bottom:16},center:{fontSize:10,color:"#657187",textAlign:"center",marginTop:6},shade:{flex:1,backgroundColor:"#000A",justifyContent:"flex-end"},sheet:{padding:18,borderTopLeftRadius:24,borderTopRightRadius:24,borderWidth:1,borderColor:"#273043",backgroundColor:"#101620"},title:{fontSize:19,fontWeight:"900",color:"#fff",marginBottom:14},emojiGrid:{flexDirection:"row",flexWrap:"wrap",gap:6},emojiBtn:{width:"11%",aspectRatio:1,borderRadius:10,backgroundColor:"#161E2A",alignItems:"center",justifyContent:"center"},bgGrid:{flexDirection:"row",flexWrap:"wrap",gap:10,marginBottom:12},bgChoice:{width:48,height:48,borderRadius:14,alignItems:"center",justifyContent:"center"},close:{marginTop:12,padding:13,borderRadius:13,alignItems:"center",backgroundColor:"#202938"},closeText:{fontWeight:"800",color:"#fff"}
});
