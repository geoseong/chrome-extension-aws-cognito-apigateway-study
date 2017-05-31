function modal(){

    $(function() {
    	// 제목입력으로 focus 이동
        document.getElementById("title").focus();

		// Enter키 폼 전송 막기
		$("input").keydown(function (key) {
			if(key.which == 13){	//키가 13이면 실행 (엔터는 13)
                $('[data-popup-ok]').trigger("click");
                return false;
			}
		});

		//----- OK
		$('[data-popup-ok]').on('click', function(e)  {
			if(window.titleform.title.value.length===0){
				document.getElementById('validation').innerText = '컨텐츠의 제목이 입력되지 않았습니다.';
				return false;
			}
			//var contenttag = JSON.stringify($('form').serializeArray());
			var contenttag = $('form').serializeArray();
			var paramTitle;
			var paramTag=[];
			for(var i=0; i<contenttag.length; i++){
				if(contenttag[i].name==="title")	paramTitle = contenttag[i].value;
				if(contenttag[i].name==="tag")	paramTag.push(contenttag[i].value);
			}
			setcontentTitleTag(paramTitle, paramTag);	// awsCognito.js에 변수 전달해서 값 갖고 있게 함.
			sendToBackgroundJS(paramTitle, paramTag);	// index.js에 변수 전달해서 한번에 background.js에 runtime.sendMessage할 수 있게함.

			var targeted_popup_class = jQuery(this).attr('data-popup-ok');
			$('[data-popup="' + targeted_popup_class + '"]').fadeOut(350);
			e.preventDefault();
		});

        //----- CLOSE
        // $('[data-popup-close]').on('click', function(e)  {
        //     alert("Close 버튼 눌렀네~")
        //     var targeted_popup_class = jQuery(this).attr('data-popup-close');
        //     $('[data-popup="' + targeted_popup_class + '"]').fadeOut(350);
        //
        //     e.preventDefault();
        // });
    });

    var modal = `
            <div class="popup" data-popup="popup-1">
                <div class="popup-inner">
                
                    <h2>아는 단어 컨텐츠 설정</h2>
                    <form name="titleform">
                        Title:<input type="text" style="margin-left: 1em;" name="title" id="title" size="50">
						<p id="validation" style="color: red; font-weight: bold; padding-left: 3em; margin: 0 0 1em 0;"></p>
                        Tag:<input type="text" style="margin-left: 1em;" name="tag" id="tag" size="50">
                            <!--<input type="checkbox" id="visible_checkbox1" name="tag" value="news"  style="margin-left: 1em; visibility: visible !important"/>-->
								<!--<label style="color:black; font-weight: normal !important" for="visible_checkbox1">News</label>-->
                            <!--<input type="checkbox" id="visible_checkbox2" name="tag" value="book" style="visibility: visible !important"/> -->
								<!--<label style="color:black; font-weight: normal !important" for="visible_checkbox2">Book</label>-->
                            <!--<input type="checkbox" id="visible_checkbox3" name="tag" value="business" style="visibility: visible !important"/> -->
								<!--<label style="color:black; font-weight: normal !important" for="visible_checkbox3">Business</label>-->
							<!--<input type="checkbox" id="visible_checkbox4" name="tag" value="sns" style="visibility: visible !important"/> -->
								<!--<label style="color:black; font-weight: normal !important" for="visible_checkbox4">SNS</label>-->
							<!--<input type="checkbox" id="visible_checkbox5" name="tag" value="daily" style="visibility: visible !important"/> -->
								<!--<label style="color:black; font-weight: normal !important" for="visible_checkbox5">Daily</label>-->
                        <p style="margin-left: 35%; margin-top: 2em;">
                        <input type="button" data-popup-ok="popup-1" value="OK" style="width: 40%;">
                        <!--<input type="button" data-popup-close="popup-1" value="Close">-->
                        </p>
                    </form>
                   
                </div>
            </div>
    `;
    document.getElementById('modal').innerHTML = modal;
}

modal();